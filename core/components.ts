import { extname } from "../deps/path.ts";
import { Page } from "./filesystem.ts";
import { Exception } from "./errors.ts";

import type { ComponentsTree, Data } from "../core.ts";

export interface Options {
  globalData: Data;
  cssFile: string;
  jsFile: string;
}

/**
 * Class to consume the components in the template engines.
 */
export default class Components {
  globalData: Data;
  cssFile: string;
  jsFile: string;

  css = new Map<string, string>();
  js = new Map<string, string>();

  constructor(options: Options) {
    this.globalData = options.globalData;
    this.cssFile = options.cssFile;
    this.jsFile = options.jsFile;
  }

  /**
   * Create and returns a proxy to use the components
   * as comp.name() instead of components.get("name").render()
   */
  toProxy(components: ComponentsTree): ProxyComponents {
    return new Proxy(components, {
      get: (target, name) => {
        if (typeof name !== "string") {
          return;
        }

        const key = name.toLowerCase();
        const component = target.get(key);

        if (!component) {
          throw new Exception(`Component "${name}" not found`);
        }

        if (component instanceof Map) {
          return this.toProxy(component);
        }

        // Save CSS & JS code for the component
        if (component.css) {
          this.css.set(key, component.css);
        }

        if (component.js) {
          this.js.set(key, component.js);
        }

        // Return the function to render the component
        return (props: Record<string, unknown>) =>
          component.render({ ...this.globalData, ...props });
      },
    }) as unknown as ProxyComponents;
  }

  /**
   * Generate and returns the assets used by the components
   */
  addAssets(pages: Page[]): void {
    if (this.css.size) {
      this.#exportPage(pages, this.css.values(), this.cssFile);
    }

    if (this.js.size) {
      this.#exportPage(pages, this.js.values(), this.jsFile);
    }
  }

  #exportPage(pages: Page[], code: IterableIterator<string>, path: string) {
    const exists = pages.find((page) => page.data.url === path);

    if (exists) {
      exists.content += Array.from(code).join("\n");
      return;
    }

    const page = new Page();
    const ext = extname(path);
    page.dest.ext = ext;
    page.dest.path = path.slice(0, -ext.length);
    page.content = Array.from(code).join("\n");
    pages.push(page);
  }
}

export interface ProxyComponents {
  [key: string]: ((props: Record<string, unknown>) => string) | ProxyComponents;
}
