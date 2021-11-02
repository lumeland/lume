import { Page, Site } from "../core.ts";
import { merge, mimes } from "../core/utils.ts";

export interface Options {
  /** A function to return the page file associated with the provided url */
  router?: Router;
}

export type Router = (url: URL) => Promise<string | undefined>;

// Default options
const defaults: Options = {};

/** A plugin to generate pages on demand in the server side */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    if (!options.router) {
      const router = new JsonRouter(site, site.src("_routes.json"));
      options.router = router.match.bind(router);
    }

    site.options.server.router ||= (url) => serve(url, site, options.router!);
  };
}

/** Build and serve a page on demand */
async function serve(
  url: URL,
  site: Site,
  router: Router,
): Promise<[BodyInit, ResponseInit] | undefined> {
  const file = await router(url);

  if (!file) {
    return;
  }

  const page = await site.renderPage(file);

  if (!page) {
    return undefined;
  }

  const body = page.content as string | Uint8Array;
  const response = {
    status: 200,
    headers: {
      "content-type": mimes.get(page.dest.ext) || mimes.get(".html")!,
    },
  };

  return [body, response];
}

/** Class to load and manage static routes in a JSON file
 *  Used by default if no router is provided
 */
export class JsonRouter {
  /** Filename to save the {url: path} of on-demand pages */
  #routesFile: string;

  /** Pages that must be generated on demand */
  #routes?: Map<string, string>;

  constructor(site: Site, routesFile: string) {
    // Events to collect and save the routes automatically
    site.addEventListener(
      "afterRender",
      () => this.#collectRoutes(site.pages),
    );
    site.addEventListener("afterBuild", () => this.#saveRoutes());

    // Ignore the routes file by the watcher
    site.options.watcher.ignore.push(routesFile);
    this.#routesFile = routesFile;
  }

  async match(url: URL): Promise<string | undefined> {
    if (!this.#routes) {
      await this.#loadRoutes();
    }

    return this.#routes?.get(url.pathname);
  }

  /** Collect the routes of all pages with data.ondemand = true */
  #collectRoutes(pages: Page[]): void {
    const routes: Map<string, string> = new Map();

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
      JSON.stringify(data, null, 2),
    );
  }
}
