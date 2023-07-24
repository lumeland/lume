import { merge } from "../core/utils.ts";
import onDemand, {
  getRouter,
  MiddlewareOptions,
} from "../middlewares/on_demand.ts";
import { extname } from "../deps/path.ts";

import type { Logger, Page, Site } from "../core.ts";

export interface Options {
  /** The file path to save the routes */
  routesPath: string;

  /** The file path to save the preloaded modules */
  preloadPath: string;

  /** Extra data to pass to the pages */
  extraData?: (request: Request) => Record<string, unknown>;
}

// Default options
export const defaults: Options = {
  routesPath: "/_routes.json",
  preloadPath: "/_preload.ts",
};

/** A plugin to generate pages on demand in the server side */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const routesFile = site.root(options.routesPath);
    const preloadFile = site.root(options.preloadPath);
    const collector = new JsonRouterCollector(routesFile, preloadFile);

    // Collect and save the routes automatically
    site.addEventListener("beforeSave", async () => {
      collector.collectRoutes(site.onDemandPages);
      const specifiers: string[] = [];

      for (const [path, entry] of site.fs.entries) {
        const ext = extname(path);

        switch (ext) {
          case ".ts":
          case ".tsx":
          case ".js":
          case ".jsx":
          case ".mjs":
            specifiers.push(entry.flags.has("remote") ? entry.src : path);
            break;

          default:
            break;
        }
      }
      await collector.saveRoutes(site.logger, specifiers);
    });

    // Ignore the routes files by the watcher
    site.options.watcher.ignore.push(options.routesPath);
    site.options.watcher.ignore.push(options.preloadPath);

    // Add the ondemand middleware
    site.options.server.middlewares ||= [];

    site._data.on_demand = {
      extraData: options.extraData,
      routesFile,
    } as MiddlewareOptions;

    site.options.server.middlewares.push(onDemand({
      site,
      router: getRouter(collector.routes),
    }));
  };
}

/** Class to load and manage static routes in a JSON file
 *  Used by default if no router is provided
 */
export class JsonRouterCollector {
  #routesFile: string;
  #preloadFile: string;

  /** Pages that must be generated on demand */
  routes = new Map<string, string>();

  constructor(routesFile: string, preloadFile: string) {
    this.#routesFile = routesFile;
    this.#preloadFile = preloadFile;
  }

  /** Collect the routes of all pages with data.ondemand = true */
  collectRoutes(pages: Page[]): void {
    this.routes.clear();

    pages.forEach((page) => {
      this.routes.set(
        page.data.url as string,
        page.src.path + page.src.ext,
      );
    });
  }

  /** Save the routes into the routesFile */
  async saveRoutes(logger: Logger, specifiers: string[]): Promise<void> {
    if (!this.routes.size) {
      return;
    }

    const data: Record<string, string> = {};

    this.routes.forEach((path, url) => {
      data[url] = path;
    });

    // Write the routes file
    await Deno.writeTextFile(
      this.#routesFile,
      JSON.stringify(data, null, 2) + "\n",
    );

    logger.log(`Routes saved at <dim>${this.#routesFile}</dim>`);

    // Write the preload file
    if (specifiers.length && Object.keys(data).length) {
      const code = Array.from(specifiers)
        .map((path) => `import {} from ".${path}";`)
        .join("\n");
      await Deno.writeTextFile(
        this.#preloadFile,
        `${code}\n`,
      );

      logger.log(`Preloader saved at <dim>${this.#preloadFile}</dim>`);
    }
  }
}
