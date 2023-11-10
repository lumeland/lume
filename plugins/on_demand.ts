import { log, merge } from "../core/utils.ts";
import onDemand, {
  getRouter,
  MiddlewareOptions,
} from "../middlewares/on_demand.ts";
import { posix } from "../deps/path.ts";

import type Site from "../core/site.ts";
import type { Page } from "../core/filesystem.ts";

export interface Options {
  /** The file path to save the routes */
  routesPath?: string;

  /** The file path to save the preloaded modules */
  preloadPath?: string;

  /** Extra data to pass to the pages */
  extraData?: (request: Request) => Record<string, unknown>;
}

// Default options
export const defaults: Options = {
  routesPath: "/_routes.json",
  preloadPath: "/_preload.ts",
};

/** A plugin to generate pages on demand in the server side */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const collector = new JsonRouterCollector({
      root: site.root(),
      routesPath: options.routesPath,
      preloadPath: options.preloadPath,
      src: site.options.src,
    });

    // Collect and save the routes automatically
    site.addEventListener("beforeSave", async () => {
      collector.collectRoutes(site.onDemandPages);
      const specifiers: string[] = [];

      for (const [path, entry] of site.fs.entries) {
        const ext = posix.extname(path);

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
      await collector.saveRoutes(specifiers);
    });

    // Ignore the routes files by the watcher
    site.options.watcher.ignore.push(options.routesPath);
    site.options.watcher.ignore.push(options.preloadPath);

    // Add the ondemand middleware
    site.options.server.middlewares ||= [];

    site._data.on_demand = {
      extraData: options.extraData,
      routesFile: site.root(options.routesPath),
    } as MiddlewareOptions;

    site.options.server.middlewares.push(onDemand({
      site,
      router: getRouter(collector.routes),
    }));
  };
}

interface JsonRouterCollectorOptions {
  root: string;
  routesPath: string;
  preloadPath: string;
  src: string;
}

/**
 * Class to load and manage static routes in a JSON file
 *  Used by default if no router is provided
 */
export class JsonRouterCollector {
  options: JsonRouterCollectorOptions;

  /** Pages that must be generated on demand */
  routes = new Map<string, string>();

  constructor(options: JsonRouterCollectorOptions) {
    this.options = options;
  }

  /** Collect the routes of all pages with data.ondemand = true */
  collectRoutes(pages: Page[]): void {
    this.routes.clear();

    pages.forEach((page) => {
      this.routes.set(
        page.data.url as string,
        page.src.path + (page.src.ext || ""),
      );
    });
  }

  /** Save the routes into the routesFile */
  async saveRoutes(specifiers: string[]): Promise<void> {
    if (!this.routes.size) {
      return;
    }

    const routesFile = posix.join(this.options.root, this.options.routesPath);
    const preloadFile = posix.join(this.options.root, this.options.preloadPath);
    const data: Record<string, string> = {};

    this.routes.forEach((path, url) => {
      data[url] = path;
    });

    // Write the routes file
    await Deno.writeTextFile(routesFile, `${JSON.stringify(data, null, 2)}\n`);

    log.info(
      `[on_demand plugin] Routes saved at <dim>${routesFile}</dim>`,
    );

    // Write the preload file
    if (specifiers.length && Object.keys(data).length) {
      const code = [
        "/**",
        " * Don't execute this function",
        " * It's just statically analyzable so dynamic imports work on Deno Deploy",
        " * @see https://deno.com/deploy/changelog#statically-analyzable-dynamic-imports",
        " */",
        "export function toStaticallyAnalyzableDynamicImports() {",
        ...specifiers.map((path) =>
          `  import("./${posix.join(".", this.options.src, path)}");`
        ),
        "}",
        "",
      ].join("\n");

      await Deno.writeTextFile(preloadFile, code);

      log.info(
        `[on_demand plugin] Preloader saved at <dim>${preloadFile}</dim>`,
      );
    }
  }
}
