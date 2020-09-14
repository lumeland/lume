import {
  join,
  dirname,
  resolve,
  extname,
  basename,
} from "./deps/path.js";
import {
  ensureDir,
  emptyDir,
  exists,
  copy,
} from "./deps/fs.js";
import { gray } from "./deps/colors.js";
import Source from "./source.js";
import Explorer from "./explorer.js";

export default class Site {
  explorer = new Explorer(this);
  engines = new Map();
  before = new Map();
  after = new Map();
  filters = new Map();

  constructor(options) {
    options.src = resolve(options.src);
    options.dest = resolve(options.dest);
    this.options = options;

    this.source = new Source(options.src);
  }

  use(plugin) {
    plugin(this);
    return this;
  }

  data(extensions, loader) {
    extensions.forEach((extension) => this.source.data.set(extension, loader));
    return this;
  }

  load(extensions, loader, asset = false) {
    extensions.forEach((extension) => this.source.pages.set(extension, loader));

    if (asset) {
      extensions.forEach((extension) => this.source.assets.add(extension));
    }
    return this;
  }

  beforeRender(extensions, transformer) {
    extensions.forEach((extension) => {
      const transformers = this.before.get(extension) || [];
      transformers.push(transformer);
      this.before.set(extension, transformers);
    });
    return this;
  }

  afterRender(extensions, transformer) {
    extensions.forEach((extension) => {
      const transformers = this.after.get(extension) || [];
      transformers.push(transformer);
      this.after.set(extension, transformers);
    });
    return this;
  }

  engine(extensions, engine) {
    extensions.forEach((extension) => this.engines.set(extension, engine));
    this.load(extensions, engine.load.bind(engine));

    for (const [name, filter] of this.filters) {
      engine.addFilter(name, filter);
    }

    return this;
  }

  filter(name, filter) {
    this.filters.set(name, filter);

    for (const engine of this.engines.values()) {
      engine.addFilter(name, filter);
    }

    return this;
  }

  copy(from, to = from) {
    this.source.staticFiles.set(join("/", from), join("/", to));
    return this;
  }

  async build() {
    await emptyDir(this.options.dest);

    return Promise.all([
      this.#copyStaticFiles(this.options.dest),
      this.source.load().then(() => this.#buildPages()),
    ]);
  }

  async update(files) {
    //Static files
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

    //Data files
    for (const file of files) {
      let dir;

      if (file.match(/\/_data\//)) {
        dir = file.split("/_data/").shift();
      } else if (file.match(/\/_data.\w+$/)) {
        dir = dirname(file);
      } else {
        continue;
      }

      this.source.load().then(() => this.#buildPages());
      return;
    }

    //Pages
    await this.source.update(files);
    const filter = (page) =>
      files.has(page.src.path + page.src.ext) || !page.dest.saved;
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
    return parallel(
      this.source.staticFiles.entries(),
      (entry) => this.#copyEntry(entry),
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
    await parallel(
      this.getPages(filter),
      async (entry) => {
        const [page, dir] = entry;
        const transformers = this.before.get(page.src.ext);

        if (transformers) {
          for (const transform of transformers) {
            await transform(page, dir);
          }
        }

        this.#urlPage(page);
      },
    );

    return parallel(
      this.getPages(filter),
      async (entry) => {
        const [page, dir] = entry;

        await this.#renderPage(page, dir);

        if (!page.content) {
          return;
        }

        const transformers = this.after.get(page.dest.ext);

        if (transformers) {
          for (const transform of transformers) {
            await transform(page, dir);
          }
        }

        return this.#savePage(page);
      },
    );
  }

  #urlPage(page) {
    const { dest } = page;

    if (page.data.permalink) {
      const ext = extname(page.data.permalink);
      dest.ext = ext || ".html";
      dest.path = ext
        ? page.data.permalink.slice(0, -ext.length)
        : page.data.permalink;
    }

    if (dest.ext === ".html" && basename(dest.path) !== "index") {
      dest.path = join(dest.path, "index");
    }

    page.url = (dest.ext === ".html" && dest.path.endsWith("/index"))
      ? dest.path.slice(0, -5)
      : dest.path + dest.ext;
  }

  async #renderPage(page) {
    const engine = this.#getEngine(page.src.ext);

    let content = page.content;
    let pageData = page.data;
    let layout = page.data.layout;

    if (engine) {
      pageData.explorer = this.explorer;
      content = await engine.render(content, pageData);
    }

    while (layout) {
      const engine = this.#getEngine(layout);
      const path = join(engine.includes, layout);
      const layoutData = await engine.load(path);
      pageData = {
        ...layoutData,
        ...pageData,
        content,
        explorer: this.explorer,
      };

      content = await engine.render(layoutData.content, pageData);
      layout = layoutData.layout;
    }

    page.content = content;
  }

  async #savePage(page) {
    page.dest.saved = true;
    const dest = page.dest.path + page.dest.ext;
    const src = page.src.path + page.src.ext;

    console.log(`🔥 ${dest} ${gray(src)}`);

    const filename = join(this.options.dest, dest);
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

function parallel(iterator, callback) {
  return Promise.all(
    Array.from(iterator).map((entry) => {
      try {
        return callback(entry);
      } catch (err) {
        console.error(`Error in: ${entry}:`);
        console.error(err);
      }
    }),
  );
}
