import { merge } from "../core/utils.ts";
import onDemand, { getRouter } from "../middlewares/on_demand.ts";
import { extname } from "../deps/path.ts";

import type { Logger, Page, Site } from "../core.ts";

export interface Options {
  /** The file path to save the routes */
  routesPath: string;

  /** The file path to save the preloaded modules */
  preloadPath: string;
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
      await collector.saveRoutes(site.logger);
    });

    // Ignore the routes files by the watcher
    site.options.watcher.ignore.push(options.routesPath);
    site.options.watcher.ignore.push(options.preloadPath);

    // Add the ondemand middleware
    site.options.server.middlewares ||= [];
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
  async saveRoutes(logger: Logger): Promise<void> {
    if (!this.routes.size) {
      return;
    }

    const data: Record<string, string> = {};
    const preloaded = new Set<string>();

    this.routes.forEach((path, url) => {
      data[url] = path;

      switch (extname(path)) {
        case ".js":
        case ".jsx":
        case ".ts":
        case ".tsx":
        case ".mjs":
          preloaded.add(path);
      }
    });

    await Deno.writeTextFile(
      this.#routesFile,
      JSON.stringify(data, null, 2) + "\n",
    );
    logger.log(`Routes saved at <dim>${this.#routesFile}</dim>`);

    if (preloaded.size) {
      await Deno.writeTextFile(
        this.#preloadFile,
        generatePreloadCode(preloaded) + "\n",
      );
      logger.log(`Preloader saved at <dim>${this.#preloadFile}</dim>`);
    }
  }
}

function generatePreloadCode(paths: Set<string>): string {
  const imports: string[] = [];
  const caches: string[] = [];

  Array.from(paths).map((path, index) => {
    imports.push(`import * as $${index} from ".${path}";`);
    caches.push(`  site.cacheFile("${path}", toData($${index}));`);
  });

  return `import { toData } from "lume/core/loaders/module.ts";
${imports.join("\n")}

import type { Site } from "lume/core.ts";

export default function (site: Site) {
${caches.join("\n")}
}`;
}
