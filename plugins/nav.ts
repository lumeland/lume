import { merge } from "../core/utils/object.ts";
import { buildSort } from "../core/searcher.ts";

import type Site from "../core/site.ts";
import type Searcher from "../core/searcher.ts";
import type { Data } from "../core/file.ts";

export interface Options {
  /** The helper name */
  name?: string;

  /** The default order for the children */
  order?: string;
}

export const defaults: Options = {
  name: "nav",
};

/**
 * A plugin to generate a navigation tree and breadcrumbs
 * @see https://lume.land/plugins/nav/
 */
export function nav(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const nav = new Nav(site.search);
    site.data(options.name, nav);
    site.addEventListener("beforeUpdate", () => nav.deleteCache());
  };
}

/** Search helper */
export class Nav {
  #cache = new Map<string, NavData>();
  #search: Searcher;

  constructor(searcher: Searcher) {
    this.#search = searcher;
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

    const parts = url.split("/").filter((part) => part !== "");
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
    const nav = this.menu(url, query, sort)!;
    const children = nav?.parent?.children;

    // Top level -> return the first child
    if (!children) {
      const child = nav?.children?.[0];
      return child ? getNextChild(child) : undefined;
    }

    const index = children.indexOf(nav);

    if (index === -1) {
      return;
    }

    // Last child -> return next parent sibling
    if (index === children.length - 1) {
      if (nav.children?.length) {
        return getNextChild(nav.children[0]);
      }

      const parent = getNextParent(nav);
      return parent ? getNextChild(parent) : undefined;
    }

    return getNextChild(children[index + 1]);
  }

  previousPage(url: string, query?: string, sort?: string): Data | undefined {
    const nav = this.menu(url, query, sort)!;
    const children = nav?.parent?.children;

    // Top level -> return none
    if (!children) {
      return;
    }

    const index = children.indexOf(nav);

    if (index === -1) {
      return;
    }

    // First child -> return the last child of the previous parent sibling
    if (index === 0) {
      const parent = getPreviousParent(nav);
      return parent ? getPreviousChild(parent) : undefined;
    }

    return getPreviousChild(children[index - 1]);
  }

  /* Build the entire navigation tree */
  #buildNav(query?: string, sort?: string): NavData {
    const nav: TempNavData = {
      slug: "",
    };

    const dataPages = this.#search.pages(query);

    for (const data of dataPages) {
      const url = data.page?.outputPath;
      const parts = url.split("/").filter((part) => part !== "");
      let part = parts.shift();
      let current = nav;

      while (part) {
        if (part === "index.html") {
          current.data = data;
          break;
        }
        if (part.endsWith(".html") && parts.length === 0) {
          part = part.slice(0, -5);
        }

        if (!current.children) {
          current.children = {};
        }

        if (!current.children[part]) {
          current = current.children[part] = {
            slug: part,
            parent: current,
          };
        } else {
          current = current.children[part];
        }

        if (parts.length === 0) {
          current.data = data;
          break;
        }

        part = parts.shift();
      }
    }

    return convert(nav, buildSort(sort || "basename"));
  }
}

export interface TempNavData {
  slug: string;
  data?: Data;
  children?: Record<string, TempNavData>;
  parent?: TempNavData;
}

export interface NavData {
  slug: string;
  data?: Data;
  children?: NavData[];
  parent?: NavData;
}

function getNextChild(item: NavData): Data | undefined {
  if (item.data) {
    return item.data;
  }

  const children = item.children;

  if (children) {
    return getNextChild(children[0]);
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

function getPreviousChild(item: NavData): Data | undefined {
  if (item.data) {
    return item.data;
  }

  const children = item.children;

  if (children) {
    return getPreviousChild(children[children.length - 1]);
  }
}

function getPreviousParent(item: NavData): NavData | undefined {
  const parent = item.parent;

  if (!parent) {
    return;
  }

  const children = parent.children!;
  const index = children.indexOf(item);

  if (index === 0) {
    return getPreviousParent(parent);
  }

  return children[index - 1];
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
    slug: temp.slug,
    data: temp.data,
    parent,
  };

  data.children = temp.children
    ? Object.values(temp.children)
      .map((child) => convert(child, order, data))
      .sort((a, b) => {
        if (a.data && b.data) {
          return order(a.data, b.data);
        }
        return a.slug < b.slug ? -1 : 1;
      })
    : undefined;

  return data;
}

export default nav

/** Extends Data interface */
declare global {
  namespace Lume {
    export interface Data {
      /** @see https://lume.land/plugins/nav/ */
      nav: Nav;
    }
  }
}
