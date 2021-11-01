import { Page, Site } from "../core.ts";
import { merge, mimes } from "../core/utils.ts";

export interface Options {
  routesFile: string;
}

// Default options
const defaults: Options = {
  routesFile: "_routes.json",
};

/** A plugin to generate pages on demand in the server side */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const routesFile = site.src(options.routesFile);
    const router = new Router(routesFile);

    site.addEventListener("beforeBuild", () => router.loadRoutes());
    site.addEventListener(
      "afterRender",
      () => router.collectRoutes(site.pages),
    );
    site.addEventListener("afterBuild", () => router.saveRoutes());

    site.options.watcher.ignore.push(routesFile);
    site.options.server.router ||= (url) => serve(url, site, router);
  };
}

/** Build and serve a page on demand */
async function serve(
  url: URL,
  site: Site,
  router: Router,
): Promise<[BodyInit, ResponseInit] | undefined> {
  const file = await router.match(url);

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

/** Class to load and manage static routes */
export class Router {
  /** Filename to save the {url: path} of on-demand pages */
  #routesFile: string;

  /** Pages that must be generated on demand */
  #pages: Map<string, string> = new Map();

  constructor(routesFile: string) {
    this.#routesFile = routesFile;
  }

  async match(url: URL): Promise<string | undefined> {
    if (!this.#pages) {
      try {
        const pages = JSON.parse(
          await Deno.readTextFile(this.#routesFile),
        ) as Record<string, string>;
        this.#pages = new Map(Object.entries(pages));
      } catch {
        return;
      }
    }

    return this.#pages.get(url.pathname);
  }

  collectRoutes(pages: Page[]): void {
    pages.forEach((page) => {
      if (page.data.ondemand) {
        this.#pages.set(page.data.url as string, page.src.path + page.src.ext);
      }
    });
  }

  async loadRoutes(): Promise<void> {
    try {
      const pages = JSON.parse(
        await Deno.readTextFile(this.#routesFile),
      ) as Record<string, string>;
      this.#pages = new Map(Object.entries(pages));
    } catch {
      // Ignore
    }
  }

  async saveRoutes(): Promise<void> {
    if (!this.#pages?.size) {
      return;
    }

    const data: Record<string, string> = {};
    this.#pages.forEach((path, url) => data[url] = path);

    await Deno.writeTextFile(
      this.#routesFile,
      JSON.stringify(data, null, 2),
    );
  }
}
