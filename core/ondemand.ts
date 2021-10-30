import { OnDemand, Page, Site } from "../core.ts";
import { mimes } from "./utils.ts";

export default class LumeOnDemand implements OnDemand {
  site: Site;

  /** Filename to save the url => path of on-demand pages */
  pathsFile: string;

  /** Pages that must be generated on demand */
  #pages?: Map<string, string>;

  constructor(site: Site) {
    this.site = site;
    this.pathsFile = this.site.src("_ondemand.json");
    this.site.options.watcher.ignore.push(this.pathsFile);
  }

  addPage(page: Page): void {
    if (!this.#pages) {
      this.#pages = new Map();
      this.site.addEventListener("afterBuild", () => this.#saveOnDemandPages());
      this.site.addEventListener(
        "afterUpdate",
        () => this.#saveOnDemandPages(),
      );
    }

    this.#pages.set(page.data.url as string, page.src.path + page.src.ext);
  }

  async response(url: URL): Promise<Response | void> {
    if (!this.#pages) {
      try {
        const pages = JSON.parse(
          await Deno.readTextFile(this.pathsFile),
        ) as Record<string, string>;
        this.#pages = new Map(Object.entries(pages));
      } catch {
        return;
      }
    }
    console.log(this.#pages);
    const file = this.#pages.get(url.pathname);

    if (!file) {
      return;
    }

    const page = await this.site.renderPage(file);

    if (!page) {
      return;
    }

    const mime = mimes.get(page.dest.ext) || mimes.get(".html")!;

    return new Response(page.content, {
      status: 200,
      headers: new Headers({
        "content-type": mime,
      }),
    });
  }

  async #saveOnDemandPages(): Promise<void> {
    if (!this.#pages?.size) {
      return;
    }

    const data: Record<string, string> = {};
    this.#pages.forEach((path, url) => data[url] = path);

    await Deno.writeTextFile(
      this.pathsFile,
      JSON.stringify(data, null, 2),
    );
  }
}
