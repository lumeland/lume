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
export default function (userOptions?: Options) {
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

/** Extends Data interface */
declare global {
  namespace Lume {
    export interface Data {
      /** @see https://lume.land/plugins/nav/ */
      nav: Nav;
    }
  }
}
