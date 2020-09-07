import {
  join,
  dirname,
  resolve,
} from "../deps/path.js";
import {
  ensureDir,
  emptyDir,
  exists,
  copy,
} from "../deps/fs.js";
import { gray } from "../deps/colors.js";
import Source from "./source.js";
import Explorer from "./explorer.js";

export default class Site {
  explorer = new Explorer(this);
  engines = new Map();
  before = new Set();
  after = new Set();
  filters = new Map();

  constructor(options) {
    options.src = resolve(options.src);
    options.dest = resolve(options.dest);
    this.options = options;

    this.source = new Source(options.src);
  }

  loadData(extension, loader) {
    this.source.data.set(extension, loader);
    return this;
  }

  loadPages(extension, loader) {
    this.source.pages.set(extension, loader);
    return this;
  }

  loadAssets(extension, loader) {
    this.source.assets.set(extension, loader);
    return this;
  }

  copy(from, to = from) {
    this.source.staticFiles.set(join("/", from), join("/", to));
    return this;
  }

  addEngine(extension, engine) {
    this.engines.set(extension, engine);
    this.loadPages(extension, engine.load.bind(engine));

    for (const [name, filter] of this.filters) {
      engine.addFilter(name, filter);
    }

    return this;
  }

  addFilter(name, filter) {
    this.filters.set(name, filter);

    for (const engine of this.engines.values()) {
      engine.addFilter(name, filter);
    }

    return this;
  }

  addTransformer(position, transformer) {
    switch (position) {
      case "before":
        this.before.add(transformer);
        break;
      case "after":
        this.after.add(transformer);
        break;
      default:
        throw new Error(
          "Invalid transformer position. Must be 'after' or 'before'",
        );
    }
  }

  async build() {
    await emptyDir(this.options.dest);

    return Promise.all([
      this.#copyStaticFiles(this.options.dest),
      this.source.load().then(() => this.#buildPages()),
    ]);
  }

  async update(files) {
    for (const entry of this.source.staticFiles) {
      const [from, to] = entry;

      for (const file of files) {
        if (file.startsWith(from)) {
          await this.#copyEntry([file, join(to, file.slice(from.length))]);
          files.delete(file);
        }
      }
    }

    if (!files.size) {
      return;
    }

    await this.source.update(files);
    const filter = (page) => files.has(page.src.path) || !page.dest.saved;
    return this.#buildPages(filter);
  }

  *getPages(filter = null, directory = "/", recursive = true) {
    const from = this.source.getDirectory(directory);

    for (const [page, dir] of from.getPages(recursive)) {
      if (page.data.draft && !this.options.dev) {
        continue;
      }

      if (!filter || filter(page)) {
        yield [page, dir];
      }
    }
  }

  async #copyStaticFiles() {
    return Promise.all(
      Array.from(this.source.staticFiles.entries()).map((entry) =>
        this.#copyEntry(entry)
      ),
    );
  }
  async #copyEntry(entry) {
    const [from, to] = entry;
    const pathFrom = join(this.options.src, from);
    const pathTo = join(this.options.dest, to);

    if (await exists(pathFrom)) {
      await ensureDir(dirname(pathTo));
      console.log(`🔥 ${from}`);
      return copy(pathFrom, pathTo, { overwrite: true });
    }
  }

  async #buildPages(filter) {
    await Promise.all(
      Array.from(this.getPages(filter)).map(async (entry) => {
        const [page, dir] = entry;

        for (const transform of this.before) {
          await transform(page, dir);
        }
      }),
    );

    return Promise.all(
      Array.from(this.getPages(filter)).map(async (entry) => {
        const [page, dir] = entry;

        try {
          if (page.isPage) {
            await this.#renderPage(page, dir);
          }

          if (!page.content || !page.dest.path) {
            return;
          }

          for (const transform of this.after) {
            await transform(page, dir, this);
          }

          return this.#savePage(page);
        } catch (err) {
          console.error(`Error in: ${page.src.path}:`);
          console.error(err);
        }
      }),
    );
  }

  async #renderPage(page) {
    const engine = this.#getEngine(page.src.path);

    let content = page.content;
    let pageData = page.data;
    let layout = page.data.layout;

    if (engine) {
      content = await engine.render(content, pageData);
    }

    while (layout) {
      const engine = this.#getEngine(layout);
      const path = join(engine.includes, layout);
      const layoutData = await engine.load(path);
      pageData = Object.assign(
        {},
        layoutData,
        pageData,
        { content },
      );

      content = await engine.render(layoutData.content, pageData);
      layout = layoutData.layout;
    }

    page.content = content;
  }

  async #savePage(page) {
    page.dest.saved = true;

    console.log(`🔥 ${page.dest.path} ${gray(page.src.path)}`);

    const filename = join(this.options.dest, page.dest.path);
    await ensureDir(dirname(filename));
    return Deno.writeTextFile(filename, page.content);
  }

  #getEngine(path) {
    for (const [ext, engine] of this.engines) {
      if (path.endsWith(ext)) {
        return engine;
      }
    }
  }
}
