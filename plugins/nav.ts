import { merge } from "../core/utils/object.ts";
import { buildSort } from "../core/searcher.ts";
import { decodeURIComponentSafe } from "../core/utils/path.ts";

import type Site from "../core/site.ts";
import type Searcher from "../core/searcher.ts";
import { SearchPluginData } from "./search.ts";

export interface NavPluginData<D extends NavPluginData<D>>
  extends SearchPluginData<D> {
  /** @see https://lume.land/plugins/nav/ */
  nav: Nav<D>;

  title?: string;
}

export interface Options {
  /** The default order for the children */
  order?: string;
}

export const defaults = {
  order: "basename=asc-locale",
} satisfies Options;

/**
 * A plugin to generate a navigation tree and breadcrumbs
 * @see https://lume.land/plugins/nav/
 */
export function nav(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return <D extends NavPluginData<D>>(site: Site<D>) => {
    const nav = new Nav(site.search, options.order);
    site.data("nav", nav);
    site.addEventListener("beforeUpdate", () => nav.deleteCache());
  };
}

/** Search helper */
export class Nav<D extends NavPluginData<D>> {
  #cache = new Map<string, NavData<D>>();
  #search: Searcher<D>;
  #defaultOrder?: string;

  constructor(searcher: Searcher<D>, defaultOrder?: string) {
    this.#search = searcher;
    this.#defaultOrder = defaultOrder;
  }

  /** Clear the cache (used after a change in watch mode) */
  deleteCache() {
    this.#cache.clear();
  }

  menu(url?: "/", query?: string, sort?: string): NavData<D>;
  menu(url: string, query?: string, sort?: string): NavData<D> | undefined;
  menu(url = "/", query?: string, sort?: string): NavData<D> | undefined {
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

  breadcrumb(url: string, query?: string, sort?: string): NavData<D>[] {
    let nav = this.menu(url, query, sort);
    const breadcrumb: NavData<D>[] = [];

    while (nav) {
      breadcrumb.unshift(nav);
      nav = nav.parent;
    }

    return breadcrumb;
  }

  nextPage(
    url: string,
    query?: string,
    sort?: string,
  ): NavPluginData<D> | undefined {
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

  previousPage(
    url: string,
    query?: string,
    sort?: string,
  ): NavPluginData<D> | undefined {
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
  #buildNav(query?: string, sort?: string): NavData<D> {
    const nav: TempNavData<D> = {
      slug: "",
      data: { basename: "" } as NavPluginData<D>,
    };

    const dataPages = this.#search.pages(query);

    for (const data of dataPages) {
      const url = data.page?.outputPath;
      const parts = url.split("/")
        .filter(filterIndex)
        .map(cleanHTMLExtension);

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
              ...this.#search.data(path) as NavPluginData<D>,
              basename: part,
            },
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

export interface TempNavData<D extends NavPluginData<D>> {
  data: NavPluginData<D>;
  slug: string;
  children?: Record<string, TempNavData<D>>;
  parent?: TempNavData<D>;
}

export interface NavData<D extends NavPluginData<D>> {
  data: NavPluginData<D>;
  slug: string;
  children?: NavData<D>[];
  parent?: NavData<D>;
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

function getFirstChild<D extends NavPluginData<D>>(
  item: NavData<D>,
): NavData<D> | undefined {
  if (item.data.url) {
    return item;
  }

  const children = item.children;

  if (children) {
    return getFirstChild(children[0]);
  }
}

function getLastChild<D extends NavPluginData<D>>(
  item: NavData<D>,
): NavData<D> | undefined {
  const children = item.children;

  if (children) {
    return getLastChild(children[children.length - 1]);
  }

  if (item.data.url) {
    return item;
  }
}

function getNextParent<D extends NavPluginData<D>>(
  item: NavData<D>,
): NavData<D> | undefined {
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

function getPreviousParent<D extends NavPluginData<D>>(
  item: NavData<D>,
): NavData<D> | undefined {
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

function searchData<D extends NavPluginData<D>>(
  parts: string[],
  menu: NavData<D>,
): NavData<D> | undefined {
  let part = parts.shift();

  if (!part) {
    return menu;
  }

  if (parts.length === 0) {
    part = cleanHTMLExtension(part);
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
function convert<D extends NavPluginData<D>>(
  temp: TempNavData<D>,
  order: (a: NavPluginData<D>, b: NavPluginData<D>) => number,
  parent?: NavData<D>,
): NavData<D> {
  const data: NavData<D> = {
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

const HTML_EXTENSION = /\.x?html$/;
function cleanHTMLExtension(path: string): string {
  return path.replace(HTML_EXTENSION, "");
}

const INDEX_HTML = /index\.x?html$/;
function filterIndex(path: string): boolean {
  return path !== "" && !INDEX_HTML.test(path);
}

export default nav;

/** Extends Data interface */
declare global {
  namespace Lume {
    export interface Data extends NavPluginData<Data> {}
  }
}
