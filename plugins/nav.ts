import { merge } from "../core/utils.ts";

import type { Data, Site } from "../core.ts";

export interface Options {
  /** The helper name */
  name: string;
}

export const defaults: Options = {
  name: "nav",
};

/** Register the plugin to enable the `search` helpers */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.data(options.name, new Nav(site));
  };
}

/** Search helper */
export class Nav {
  #site: Site;
  #nav?: NavData;

  constructor(site: Site) {
    this.#site = site;
    site.addEventListener("beforeUpdate", () => this.#nav = undefined);
  }

  menu(): NavData;
  menu(url: string): NavData | undefined;
  menu(url?: string): NavData | undefined {
    if (!this.#nav) {
      this.#nav = this.#buildNav();
    }

    if (url) {
      return searchData(url, this.#nav);
    }

    return this.#nav;
  }

  breadcrumb(url: string): NavData[] {
    let nav = this.menu(url);
    const breadcrumb: NavData[] = [];

    while (nav) {
      breadcrumb.unshift(nav);
      nav = nav.parent;
    }
    return breadcrumb;
  }

  /* Build the entire navigation tree */
  #buildNav(): NavData {
    const nav: TempNavData = {
      title: "index",
    };

    const page404 = this.#site.options.server.page404;

    const pages = this.#site.pages.filter((page) =>
      page.outputPath?.endsWith(".html") &&
      page.data.url != page404
    );

    for (const page of pages) {
      const url = page.outputPath;

      if (!url) {
        continue;
      }

      const parts = url.split("/").filter((part) => part !== "");
      let part = parts.shift();
      let current = nav;

      while (part) {
        if (part === "index.html") {
          if (page.data.title) {
            current.title = page.data.title;
          }
          current.url = page.data.url as string;
          current.data = page.data;
          break;
        }

        if (!current.children) {
          current.children = {};
        }

        if (!current.children[part]) {
          current = current.children[part] = {
            title: part,
            parent: current,
          };
        } else {
          current = current.children[part];
        }
        part = parts.shift();
      }
    }

    return convert(nav);
  }
}

export interface NavData {
  title: string;
  url?: string;
  data?: Data;
  children?: NavData[];
  parent?: NavData;
}

interface TempNavData extends Omit<NavData, "children" | "parent"> {
  children?: Record<string, TempNavData>;
  parent?: TempNavData;
}

function searchData(url: string, menu: NavData): NavData | undefined {
  if (menu.url === url) {
    return menu;
  }

  if (menu.children?.length) {
    for (const child of menu.children) {
      const result = searchData(url, child);
      if (result) {
        return result;
      }
    }
  }
}

// Convert TempNavData to NavData
function convert(temp: TempNavData, parent?: NavData): NavData {
  const data: NavData = {
    title: temp.title,
    url: temp.url,
    data: temp.data,
    parent,
  };

  data.children = temp.children
    ? Object.values(temp.children)
      .map((child) => convert(child, data))
      .sort((a, b) => a.title < b.title ? -1 : 1)
    : undefined;

  return data;
}
