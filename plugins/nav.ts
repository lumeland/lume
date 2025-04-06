import { merge } from "../core/utils/object.ts";
import { buildSort } from "../core/searcher.ts";
import { decodeURIComponentSafe } from "../core/utils/path.ts";

import type Site from "../core/site.ts";
import type Searcher from "../core/searcher.ts";
import type { Data } from "../core/file.ts";

export interface Options {
  /** The default order for the children */
  order?: string;
}

export const defaults: Options = {
  order: "basename=asc-locale",
};

/**
 * A plugin to generate a navigation tree and breadcrumbs
 * @see https://lume.land/plugins/nav/
 */
export function nav(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const nav = new Nav(site.search, options.order);
    site.data("nav", nav);
    site.addEventListener("beforeUpdate", () => nav.deleteCache());
  };
}

/** Search helper */
export class Nav {
  #cache = new Map<string, NavData>();
  #search: Searcher;
  #defaultOrder?: string;

  constructor(searcher: Searcher, defaultOrder?: string) {
    this.#search = searcher;
    this.#defaultOrder = defaultOrder;
  }

  /** Clear the cache (used after a change in watch mode) */
  deleteCache() {
    this.#cache.clear();
  }

  menu(url?: "/", query?: string, sort?: string): NavData;
  menu(url: string, query?: string, sort?: string): NavData | undefined;
  menu(url = "/", query?: string, sort?: string): NavData | undefined {
    const id = JSON.stringify([query, sort]);
    let nav = this.#cache.get(id);

    if (!nav) {
      nav = this.#buildNav(query, sort);
      this.#cache.set(id, nav);
    }

    if (url.endsWith("/index.html")) {
      url = url.slice(0, -10);
    }

    const parts = url.split("/").filter((part) => part !== "").map(
      decodeURIComponentSafe,
    );
    return searchData(parts, nav);
  }

  breadcrumb(url: string, query?: string, sort?: string): NavData[] {
    let nav = this.menu(url, query, sort);
    const breadcrumb: NavData[] = [];

    while (nav) {
      breadcrumb.unshift(nav);
      nav = nav.parent;
    }

    return breadcrumb;
  }

  nextPage(url: string, query?: string, sort?: string): Data | undefined {
    const item = this.menu(url, query, sort)!;

    // It has a child -> return the first child with url
    if (item?.children?.length) {
      return getFirstChild(item.children[0])?.data;
    }

    const siblings = item?.parent?.children;

    if (!siblings) {
      return;
    }

    const index = siblings.indexOf(item);

    // Has next sibling -> return the next sibling
    if (index < siblings.length - 1) {
      return getFirstChild(siblings[index + 1])?.data;
    }

    // Last sibling -> return next parent sibling
    const parent = getNextParent(item);
    return parent ? getFirstChild(parent)?.data : undefined;
  }

  previousPage(url: string, query?: string, sort?: string): Data | undefined {
    const nav = this.menu(url, query, sort)!;
    const siblings = nav?.parent?.children;

    // Top level -> return none
    if (!siblings) {
      return;
    }

    const index = siblings.indexOf(nav);

    if (index === -1) {
      return;
    }

    // First child -> return the last child of the previous parent sibling
    if (index === 0) {
      return getPreviousParent(nav)?.data;
    }

    return getLastChild(siblings[index - 1])?.data;
  }

  /* Build the entire navigation tree */
  #buildNav(query?: string, sort?: string): NavData {
    const nav: TempNavData = {
      slug: "",
      data: { basename: "" } as Data,
    };

    const dataPages = this.#search.pages(query);

    for (const data of dataPages) {
      const url = data.page?.outputPath;
      const parts = url.split("/")
        .filter((part) => part !== "" && part !== "index.html")
        .map((part) => part.endsWith(".html") ? part.slice(0, -5) : part);

      let current = nav;
      let path = "";

      while (true) {
        const part = parts.shift();

        // we are at the last part of the path
        if (!part) {
          current.data = data;
          break;
        }

        current.children ??= {};
        path += `/${part}`;

        if (!current.children[part]) {
          current = current.children[part] = {
            slug: part,
            data: {
              ...this.#search.data(path),
              basename: part,
            } as Data,
            parent: current,
          };
        } else {
          current = current.children[part];
        }
      }
    }

    return convert(nav, buildSort(sort || this.#defaultOrder || "basename"));
  }
}

export interface TempNavData {
  data: Data;
  slug: string;
  children?: Record<string, TempNavData>;
  parent?: TempNavData;
}

export interface NavData {
  data: Data;
  slug: string;
  children?: NavData[];
  parent?: NavData;
  toJSON(): NavJSON;
}

export interface NavJSON {
  slug: string;
  data: {
    title?: string;
    url?: string;
    basename: string;
  };
  children?: NavJSON[];
}

function getFirstChild(item: NavData): NavData | undefined {
  if (item.data.url) {
    return item;
  }

  const children = item.children;

  if (children) {
    return getFirstChild(children[0]);
  }
}

function getLastChild(item: NavData): NavData | undefined {
  const children = item.children;

  if (children) {
    return getLastChild(children[children.length - 1]);
  }

  if (item.data.url) {
    return item;
  }
}

function getNextParent(item: NavData): NavData | undefined {
  const parent = item.parent;

  if (!parent) {
    return;
  }

  const children = parent.children!;
  const index = children.indexOf(item);

  if (index === children.length - 1) {
    return getNextParent(parent);
  }

  return children[index + 1];
}

function getPreviousParent(item: NavData): NavData | undefined {
  const parent = item.parent;

  if (!parent) {
    return;
  }

  const children = parent.children!;
  const index = children.indexOf(item);

  if (index === 0) {
    if (parent.data.url) {
      return parent;
    }
    return getPreviousParent(parent);
  }

  return getLastChild(children[index - 1]);
}

function searchData(parts: string[], menu: NavData): NavData | undefined {
  let part = parts.shift();

  if (!part) {
    return menu;
  }

  if (part.endsWith(".html") && parts.length === 0) {
    part = part.slice(0, -5);
  }

  if (menu.children?.length) {
    for (const child of menu.children) {
      if (child.slug === part) {
        return searchData(parts, child);
      }
    }
  }
}

// Convert TempNavData to NavData
function convert(
  temp: TempNavData,
  order: (a: Data, b: Data) => number,
  parent?: NavData,
): NavData {
  const data: NavData = {
    data: temp.data,
    slug: temp.slug,
    parent,
    toJSON() {
      return {
        slug: this.slug,
        data: {
          title: this.data.title,
          url: this.data.url,
          basename: this.data.basename,
        },
        children: this.children?.map((child) => child.toJSON()),
      };
    },
  };

  data.children = temp.children
    ? Object.values(temp.children)
      .map((child) => convert(child, order, data))
      .sort((a, b) => order(a.data, b.data))
    : undefined;

  return data;
}

export default nav;

/** Extends Data interface */
declare global {
  namespace Lume {
    export interface Data {
      /** @see https://lume.land/plugins/nav/ */
      nav: Nav;
    }
  }
}
