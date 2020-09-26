import {
  join,
  dirname,
  resolve,
  extname,
  basename,
  normalize,
} from "./deps/path.js";
import {
  ensureDir,
  emptyDir,
  exists,
  copy,
} from "./deps/fs.js";
import { gray } from "./deps/colors.js";
import { createHash } from "./deps/hash.js";
import Source from "./source.js";
import Searcher from "./searcher.js";

export default class Site {
  searcher = new Searcher(this);
  engines = new Map();
  before = new Map();
  after = new Map();
  filters = new Map();

  constructor(options = {}) {
    this.options = {
      src: resolve(options.src || "./"),
      dest: resolve(options.dest || "./_site"),
      dev: !!options.dev,
      location: (typeof options.location === "string")
        ? new URL(options.location)
        : options.location,
    };

    this.source = new Source(this.options.src);
  }

  /**
   * Use a plugin
   */
  use(plugin) {
    plugin(this);
    return this;
  }

  /**
   * Register a data loader for some extensions
   */
  data(extensions, loader) {
    extensions.forEach((extension) => this.source.data.set(extension, loader));
    return this;
  }

  /**
   * Register a page/assets loader for some extensions
   */
  load(extensions, loader, asset = false) {
    extensions.forEach((extension) => this.source.pages.set(extension, loader));

    if (asset) {
      extensions.forEach((extension) => this.source.assets.add(extension));
    }
    return this;
  }

  /**
   * Register a transformer executed before render some extensions
   */
  beforeRender(extensions, transformer) {
    extensions.forEach((extension) => {
      const transformers = this.before.get(extension) || [];
      transformers.push(transformer);
      this.before.set(extension, transformers);
    });
    return this;
  }

  /**
   * Register a transformer executed after render some extensions
   */
  afterRender(extensions, transformer) {
    extensions.forEach((extension) => {
      const transformers = this.after.get(extension) || [];
      transformers.push(transformer);
      this.after.set(extension, transformers);
    });
    return this;
  }

  /**
   * Register template engine used for some extensions
   */
  engine(extensions, engine) {
    extensions.forEach((extension) => this.engines.set(extension, engine));
    this.load(extensions, engine.load.bind(engine));

    for (const [name, filter] of this.filters) {
      engine.addFilter(name, filter);
    }

    return this;
  }

  /**
   * Register a template filter
   */
  filter(name, filter) {
    this.filters.set(name, filter);

    for (const engine of this.engines.values()) {
      engine.addFilter(name, filter);
    }

    return this;
  }

  /**
   * Copy static files/folders without processing
   */
  copy(from, to = from) {
    this.source.staticFiles.set(join("/", from), join("/", to));
    return this;
  }

  /**
   * Build the entire site
   */
  async build() {
    await emptyDir(this.options.dest);

    for (const [from, to] of this.source.staticFiles) {
      await this.#copyStatic(from, to);
    }

    await this.source.loadDirectory();
    await this.#buildPages();
  }

  /**
   * Rebuild some files that might be changed
   */
  async update(files) {
    for (const file of files) {
      // file inside a _data file or folder
      if (file.includes("/_data/") || file.match(/\/_data.\w+$/)) {
        await this.source.loadFile(file);
        continue;
      }

      // file path contains /_ or /.
      if (file.includes("/_") || file.includes("/.")) {
        continue;
      }

      //Static file
      const entry = this.source.isStatic(file);
      if (entry) {
        const [from, to] = entry;

        await this.#copyStatic(file, join(to, file.slice(from.length)));
        continue;
      }

      //Default
      await this.source.loadFile(file);
    }

    return this.#buildPages();
  }

  /**
   * Returns the url of a page
   */
  url(path, absolute) {
    if (path.startsWith("./") || path.startsWith("../")) {
      return path;
    }

    try {
      return new URL(path).toString();
    } catch (err) {
      if (!this.options.location) {
        return normalize(join("/", path));
      }

      path = normalize(join(this.options.location.pathname, path));

      return absolute ? this.options.location.origin + path : path;
    }
  }

  /**
   * Return the site pages
   */
  *getPages(directory = "/", recursive = true) {
    const from = this.source.getDirectory(directory);

    for (const [page, dir] of from.getPages(recursive)) {
      if (page.data.draft && !this.options.dev) {
        continue;
      }

      yield [page, dir];
    }
  }

  /**
   * Copy a static file
   */
  async #copyStatic(from, to) {
    const pathFrom = join(this.options.src, from);
    const pathTo = join(this.options.dest, to);

    if (await exists(pathFrom)) {
      await ensureDir(dirname(pathTo));
      console.log(`🔥 ${from}`);
      return copy(pathFrom, pathTo, { overwrite: true });
    }
  }

  /**
   * Build the pages
   */
  async #buildPages() {
    for (const entry of this.getPages()) {
      const [page, dir] = entry;

      page.content = page.data.content;

      if (this.#expandPage(page, dir)) {
        page.type = "generator";
        continue;
      }

      this.#urlPage(page);
    }

    for (const entry of this.getPages()) {
      const [page, dir] = entry;

      if (page.type === "generator") {
        continue;
      }

      const before = this.before.get(page.src.ext);

      if (before) {
        for (const transform of before) {
          await transform(page, dir);
        }
      }

      await this.#renderPage(page, dir);

      if (!page.content) {
        continue;
      }

      const after = this.after.get(page.dest.ext);

      if (after) {
        for (const transform of after) {
          await transform(page, dir);
        }
      }

      await this.#savePage(page);
    }
  }

  /**
   * Generate the url and dest info of a page
   */
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

    page.data.url = (dest.ext === ".html" && dest.path.endsWith("/index"))
      ? dest.path.slice(0, -5)
      : dest.path + dest.ext;
  }

  /**
   * Generate subpages (for pagination)
   */
  #expandPage(page, dir) {
    const content = page.content;

    if (typeof content === "function") {
      let data = page.fullData;
      data.search = this.searcher;

      const result = content(data, this.filters);

      if (String(result) === "[object Generator]") {
        const name = basename(page.src.path);
        let num = 1;

        for (const pageData of result) {
          const key = `${name}-${num}${page.src.ext}`;
          dir.setPage(key, page.duplicate(pageData));
          num++;
        }

        return num;
      }

      page.content = result;
    }
  }

  /**
   * Render a page
   */
  async #renderPage(page) {
    const engine = this.#getEngine(page.src.ext);

    let content = page.content;
    let pageData = page.fullData;
    let layout = pageData.layout;

    if (engine) {
      pageData.search = this.searcher;
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
        search: this.searcher,
      };

      content = await engine.render(layoutData.content, pageData);
      layout = layoutData.layout;
    }

    page.content = content;
  }

  /**
   * Save a page
   */
  async #savePage(page) {
    const sha1 = createHash("sha1");
    sha1.update(page.content);
    const hash = sha1.toString();

    //The page content didn't change
    if (page.dest.hash === hash) {
      return;
    }
    page.dest.hash = hash;
    const dest = page.dest.path + page.dest.ext;
    const src = page.src.path + page.src.ext;

    console.log(`🔥 ${dest} ${gray(src)}`);

    const filename = join(this.options.dest, dest);
    await ensureDir(dirname(filename));
    return Deno.writeTextFile(filename, page.content);
  }

  /**
   * Get the engine used by a path or extension
   */
  #getEngine(path) {
    for (const [ext, engine] of this.engines) {
      if (path.endsWith(ext)) {
        return engine;
      }
    }
  }
}
