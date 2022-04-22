import { Page } from "./filesystem.ts";
import { Exception } from "./errors.ts";

import type { ComponentsTree } from "../core.ts";

export interface Options {
  cssFile: string;
  jsFile: string;
}

/**
 * Class to consume the components in the template engines.
 */
export default class Components {
  cssFile: string;
  jsFile: string;

  css = new Map<string, string>();
  js = new Map<string, string>();

  constructor(options: Options) {
    this.cssFile = options.cssFile;
    this.jsFile = options.jsFile;
  }

  /**
   * Create and returns a proxy to use the components
   * as comp.name() instead of components.get("name").render()
   */
  toProxy(components: ComponentsTree): ProxyComponents {
    const node = {
      _components: components,
      _proxies: new Map(),
    };
    return new Proxy(node, {
      get: (target, name) => {
        if (typeof name !== "string" || name in target) {
          return;
        }

        const key = name.toLowerCase();

        if (target._proxies.has(key)) {
          return target._proxies.get(key);
        }

        const component = target._components.get(key);

        if (!component) {
          throw new Exception(`Component "${name}" not found`);
        }

        if (component instanceof Map) {
          const proxy = this.toProxy(component);
          target._proxies.set(key, proxy);
          return proxy;
        }

        // Save CSS & JS code for the component
        if (component.css) {
          this.css.set(key, component.css);
        }

        if (component.js) {
          this.js.set(key, component.js);
        }

        // Return the function to render the component
        return (props: Record<string, unknown>) => component.render(props);
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

    const page = Page.create(path, Array.from(code).join("\n"));
    pages.push(page);
  }
}

export type ComponentFunction = (props: Record<string, unknown>) => string;

export interface ProxyComponents {
  [key: string]: ComponentFunction | ProxyComponents;
}
