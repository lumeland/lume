import { Router, Site } from "../core.ts";

export default class LumeRouter implements Router {
  /** Filename to save the {url: path} of on-demand pages */
  #routesFile: string;

  /** Pages that must be generated on demand */
  #pages: Map<string, string> = new Map();

  constructor(site: Site, routesFile: string = "_ondemand.json") {
    this.#routesFile = site.src(routesFile);
    site.options.watcher.ignore.push(this.#routesFile);

    site.addEventListener("beforeBuild", () => this.#loadRoutes());
    site.addEventListener("afterRender", () => this.#collectRoutes(site));
    site.addEventListener("afterBuild", () => this.#saveRoutes());
  }

  async match(url: URL): Promise<string | null> {
    if (!this.#pages) {
      try {
        const pages = JSON.parse(
          await Deno.readTextFile(this.#routesFile),
        ) as Record<string, string>;
        this.#pages = new Map(Object.entries(pages));
      } catch {
        return null;
      }
    }

    return this.#pages.get(url.pathname) || null;
  }

  #collectRoutes(site: Site): void {
    site.pages.forEach((page) => {
      if (page.data.ondemand) {
        this.#pages.set(page.data.url as string, page.src.path + page.src.ext);
      }
    });
  }

  async #loadRoutes(): Promise<void> {
    try {
      const pages = JSON.parse(
        await Deno.readTextFile(this.#routesFile),
      ) as Record<string, string>;
      this.#pages = new Map(Object.entries(pages));
    } catch {
      // Ignore
    }
  }

  async #saveRoutes(): Promise<void> {
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
