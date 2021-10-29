import { gray } from "../deps/colors.ts";
import { dirname } from "../deps/path.ts";
import { copy, emptyDir, ensureDir } from "../deps/fs.ts";
import { Emitter, Page, Site } from "../core.ts";
import { createHash } from "../deps/hash.ts";
import { normalizePath } from "./utils.ts";

export default class LumeEmitter implements Emitter {
  site: Site;
  #hashes = new Map();

  constructor(site: Site) {
    this.site = site;
  }

  async savePage(page: Page) {
    // Ignore empty files
    if (!page.content) {
      return;
    }

    const metric = this.site.metrics.start("Save", { page });
    const dest = page.dest.path + page.dest.ext;

    const sha1 = createHash("sha1");
    sha1.update(page.content);
    const hash = sha1.toString();
    const previousHash = this.#hashes.get(dest);

    // The page content didn't change
    if (previousHash === hash) {
      return;
    }

    this.#hashes.set(dest, hash);

    if (!this.site.options.quiet) {
      const src = page.src.path
        ? page.src.path + (page.src.ext || "")
        : "(generated)";
      console.log(`🔥 ${dest} ${gray(src)}`);
    }

    const filename = this.site.dest(dest);
    await ensureDir(dirname(filename));

    page.content instanceof Uint8Array
      ? await Deno.writeFile(filename, page.content)
      : await Deno.writeTextFile(filename, page.content);

    metric.stop();
  }

  async copyFile(from: string, to: string) {
    const metric = this.site.metrics.start("Copy", { from });
    const pathFrom = this.site.src(from);
    const pathTo = this.site.dest(to);

    try {
      await ensureDir(dirname(pathTo));
      if (!this.site.options.quiet) {
        console.log(`🔥 ${normalizePath(to)} ${gray(from)}`);
      }
      return copy(pathFrom, pathTo, { overwrite: true });
    } catch {
      //Ignored
    }

    metric.stop();
  }

  async clear() {
    await emptyDir(this.site.dest());
    this.#hashes.clear();
  }
}
