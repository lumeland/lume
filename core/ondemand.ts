import { OnDemand, Page, Site } from "../core.ts";
import { mimes } from "./utils.ts";

export default class LumeOnDemand implements OnDemand {
  site: Site;
  pathsFile: string;
  #pages: Record<string, string> = {};

  constructor(site: Site) {
    this.site = site;

    site.addEventListener("afterBuild", () => this.#saveOnDemandPages());
    site.addEventListener("afterUpdate", () => this.#saveOnDemandPages());
    this.pathsFile = site.src("_ondemand.json");
    site.options.watcher.ignore.push(this.pathsFile);
  }

  addPage(page: Page): void {
    this.#pages[page.data.url as string] = page.src.path + page.src.ext;
  }

  async response(url: URL): Promise<Response | undefined> {
    const file = this.#pages[url.pathname];

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

  #saveOnDemandPages(): Promise<void> {
    return Deno.writeTextFile(
      this.pathsFile,
      JSON.stringify(this.#pages, null, 2),
    );
  }
}
