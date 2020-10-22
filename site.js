import {
  basename,
  dirname,
  extname,
  join,
  normalize,
  resolve,
} from "./deps/path.js";
import { copy, emptyDir, ensureDir, exists } from "./deps/fs.js";
import { gray } from "./deps/colors.js";
import { createHash } from "./deps/hash.js";
import Source from "./source.js";
import { concurrent } from "./utils.js";

const defaults = {
  src: "./",
  dest: "./_site",
  dev: false,
  prettyUrls: true,
};

export default class Site {
  engines = new Map();
  filters = new Map();
  extraData = {};
  listeners = new Map();
  processors = new Map();
  pages = [];

  constructor(options = {}) {
    options = { ...defaults, ...options };

    this.options = {
      src: resolve(options.src),
      dest: resolve(options.dest),
      dev: options.dev,
      prettyUrls: options.prettyUrls,
      location: (typeof options.location === "string")
        ? new URL(options.location)
        : options.location,
    };

    this.source = new Source(this.options.src);
  }

  /**
   * Adds an event
   */
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
    return this;
  }

  /**
   * Dispatch an event
   */
  dispatchEvent(event) {
    const type = event.type;
    const listeners = this.listeners.get(type);

    if (!listeners) {
      return;
    }

    for (const listener of listeners) {
      if (listener(event) === false) {
        return false;
      }
    }
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
   * Register a processor for some extensions
   */
  process(extensions, processor) {
    extensions.forEach((extension) => {
      const processors = this.processors.get(extension) || [];
      processors.push(processor);
      this.processors.set(extension, processors);
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
   * Register extra data accesible by layouts
   */
  data(name, data) {
    this.extraData[name] = data;
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
   * Clear the dest folder
   */
  async clear() {
    await emptyDir(this.options.dest);
  }

  /**
   * Build the entire site
   */
  async build() {
    this.dispatchEvent({ type: "beforeBuild" });

    await this.clear();

    for (const [from, to] of this.source.staticFiles) {
      await this.#copyStatic(from, to);
    }

    await this.source.loadDirectory();
    await this.#buildPages();

    this.dispatchEvent({ type: "afterBuild" });
  }

  /**
   * Reload some files that might be changed
   */
  async update(files) {
    this.dispatchEvent({ type: "beforeBuild" });

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

    await this.#buildPages();

    this.dispatchEvent({ type: "afterBuild" });
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
    this.pages = [];

    for (const page of this.source.root.getPages()) {
      if (page.data.draft && !this.options.dev) {
        continue;
      }

      page.content = page.data.content;

      if (this.#expandPage(page)) {
        continue;
      }

      this.#urlPage(page);

      this.pages.push(page);
    }

    return concurrent(
      this.pages,
      async (page) => {
        await this.#renderPage(page);

        if (!page.content) {
          return;
        }

        const processors = this.processors.get(page.dest.ext);

        if (processors) {
          for (const process of processors) {
            await process(page);
          }
        }

        await this.#savePage(page);
      },
    );
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

      if (!ext && this.options.prettyUrls) {
        dest.path = join(dest.path, "index");
      }
    } else if (
      this.options.prettyUrls && dest.ext === ".html" &&
      basename(dest.path) !== "index"
    ) {
      dest.path = join(dest.path, "index");
    }

    page.data.url = (dest.ext === ".html" && basename(dest.path) === "index")
      ? dest.path.slice(0, -5)
      : dest.path + dest.ext;
  }

  /**
   * Generate subpages (for pagination)
   */
  #expandPage(page, dir) {
    const content = page.content;

    if (typeof content === "function") {
      const data = { ...page.fullData, ...this.extraData };
      const result = content(data, this.filters);

      if (String(result) === "[object Generator]") {
        let num = 1;

        for (const pageData of result) {
          const key = `${page.src.path}-${num}${page.src.ext}`;
          const value = page.duplicate(pageData);

          if (value.data.content === content) {
            value.data.content = null;
          }

          dir.setPage(key, value);
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
    let pageData = { ...page.fullData, ...this.extraData };
    let layout = pageData.layout;

    if (engine) {
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
        ...this.extraData,
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
