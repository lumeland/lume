import { merge } from "../core/utils.ts";
import onDemand from "../middlewares/on_demand.ts";

import type { Page, Site } from "../core.ts";
import type { Router } from "../middlewares/on_demand.ts";

export interface Options {
  /** A function to return the page file associated with the provided url */
  router?: Router;
}

// Default options
export const defaults: Options = {};

/** A plugin to generate pages on demand in the server side */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    if (!options.router) {
      const router = new JsonRouter(site.src("_routes.json"));
      router.startCollecting(site);
      options.router = router.match.bind(router);
    }

    const { router } = options;

    site.options.server.middlewares ||= [];
    site.options.server.middlewares.push(onDemand({ site, router }));
  };
}

/** Class to load and manage static routes in a JSON file
 *  Used by default if no router is provided
 */
export class JsonRouter {
  /** Filename to save the {url: path} of on-demand pages */
  #routesFile: string;

  /** Pages that must be generated on demand */
  #routes?: Map<string, string>;

  constructor(routesFile: string) {
    this.#routesFile = routesFile;
  }

  async match(url: URL): Promise<string | undefined> {
    if (!this.#routes) {
      await this.#loadRoutes();
    }

    const { pathname } = url;
    const path = this.#routes?.get(pathname);

    // Handle urls like /example as /example/
    if (!path && !pathname.endsWith("/")) {
      return this.#routes?.get(pathname + "/");
    }

    return path;
  }

  startCollecting(site: Site): void {
    // Events to collect and save the routes automatically
    site.addEventListener(
      "afterRender",
      () => this.#collectRoutes(site.pages),
    );
    site.addEventListener("afterBuild", () => this.#saveRoutes());

    // Ignore the routes file by the watcher
    site.options.watcher.ignore.push(this.#routesFile);
  }

  /** Collect the routes of all pages with data.ondemand = true */
  #collectRoutes(pages: Page[]): void {
    const routes = new Map<string, string>();

    pages.forEach((page) => {
      if (page.data.ondemand) {
        routes.set(page.data.url as string, page.src.path + page.src.ext);
      }
    });

    this.#routes = routes;
  }

  /** Load the routes from the routesFile */
  async #loadRoutes(): Promise<void> {
    try {
      const pages = JSON.parse(
        await Deno.readTextFile(this.#routesFile),
      ) as Record<string, string>;
      this.#routes = new Map(Object.entries(pages));
    } catch {
      this.#routes = new Map();
    }
  }

  /** Save the routes into the routesFile */
  async #saveRoutes(): Promise<void> {
    if (!this.#routes?.size) {
      return;
    }

    const data: Record<string, string> = {};
    this.#routes.forEach((path, url) => data[url] = path);

    await Deno.writeTextFile(
      this.#routesFile,
      JSON.stringify(data, null, 2) + "\n",
    );
  }
}
