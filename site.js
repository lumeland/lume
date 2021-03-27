import { basename, dirname, extname, join } from "./deps/path.js";
import { copy, emptyDir, ensureDir, exists } from "./deps/fs.js";
import { gray } from "./deps/colors.js";
import { createHash } from "./deps/hash.js";
import Source from "./source.js";
import Scripts from "./scripts.js";
import { concurrent, searchByExtension, slugify } from "./utils.js";

const defaults = {
  cwd: Deno.cwd(),
  src: "./",
  dest: "./_site",
  dev: false,
  prettyUrls: true,
  flags: [],
  server: {
    port: 3000,
    page404: "/404.html",
  },
};

export default class Site {
  engines = new Map();
  filters = new Map();
  extraData = {};
  listeners = new Map();
  processors = new Map();
  pages = [];

  #hashes = new Map();

  constructor(options = {}) {
    this.options = { ...defaults, ...options };

    this.options.location = (options.location instanceof URL)
      ? this.options.location
      : new URL(this.options.location || "http://localhost");

    this.source = new Source(this);
    this.scripts = new Scripts(this);
  }

  /**
   * Returns the src path
   */
  src(...path) {
    return join(this.options.cwd, this.options.src, ...path);
  }

  /**
   * Returns the dest path
   */
  dest(...path) {
    return join(this.options.cwd, this.options.dest, ...path);
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
  async dispatchEvent(event) {
    const type = event.type;
    const listeners = this.listeners.get(type);

    if (!listeners) {
      return;
    }

    for (let listener of listeners) {
      if (typeof listener === "string") {
        listener = [listener];
      }

      if (Array.isArray(listener)) {
        const success = await this.run(...listener);

        if (!success) {
          return false;
        }

        continue;
      }

      if (await listener(event) === false) {
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
   * Register a script
   */
  script(name, ...scripts) {
    this.scripts.set(name, ...scripts);
    return this;
  }

  /**
   * Register a data loader for some extensions
   */
  loadData(extensions, loader) {
    extensions.forEach((extension) => this.source.data.set(extension, loader));
    return this;
  }

  /**
   * Register a page loader for some extensions
   */
  loadPages(extensions, loader) {
    extensions.forEach((extension) => this.source.pages.set(extension, loader));
    return this;
  }

  /**
   * Register an assets loader for some extensions
   */
  loadAssets(extensions, loader) {
    extensions.forEach((extension) => this.source.pages.set(extension, loader));
    extensions.forEach((extension) => this.source.assets.add(extension));
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
    this.loadPages(extensions, engine.load.bind(engine));

    for (const [name, filter] of this.filters) {
      engine.addFilter(name, ...filter);
    }

    return this;
  }

  /**
   * Register a template filter
   */
  filter(name, filter, async) {
    this.filters.set(name, [filter, async]);

    for (const engine of this.engines.values()) {
      engine.addFilter(name, filter, async);
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
   * Ignore one or several files or folders
   */
  ignore(...paths) {
    paths.forEach((path) => this.source.ignored.add(join("/", path)));
    return this;
  }

  /** 
   * Clear the dest folder
   */
  async clear() {
    await emptyDir(this.dest());
  }

  /**
   * Build the entire site
   */
  async build() {
    await this.dispatchEvent({ type: "beforeBuild" });

    await this.clear();

    for (const [from, to] of this.source.staticFiles) {
      await this.#copyStatic(from, to);
    }

    await this.source.loadDirectory();
    await this.#buildPages();

    await this.dispatchEvent({ type: "afterBuild" });
  }

  /**
   * Reload some files that might be changed
   */
  async update(files) {
    await this.dispatchEvent({ type: "beforeUpdate", files });

    let rebuildIsNeeded = false;

    for (const file of files) {
      // It's an ignored file
      if (this.source.isIgnored(file)) {
        continue;
      }

      // It's inside a _data file or folder
      if (file.includes("/_data/") || file.match(/\/_data.\w+$/)) {
        await this.source.loadFile(file);
        rebuildIsNeeded = true;
        continue;
      }

      // The path contains /_ or /.
      if (file.includes("/_") || file.includes("/.")) {
        continue;
      }

      // It's a static file
      const entry = this.source.isStatic(file);

      if (entry) {
        const [from, to] = entry;

        await this.#copyStatic(file, join(to, file.slice(from.length)));
        continue;
      }

      // Default
      await this.source.loadFile(file);
      rebuildIsNeeded = true;
    }

    if (rebuildIsNeeded) {
      await this.#buildPages();
    }

    await this.dispatchEvent({ type: "afterUpdate", files });
  }

  /**
   * Run a script
   */
  async run(name, options = {}) {
    return await this.scripts.run(options, name);
  }

  /**
   * Return the site flags
   */
  get flags() {
    return this.options.flags || [];
  }

  /**
   * Returns the url of a page
   */
  url(path, absolute) {
    if (
      path.startsWith("./") || path.startsWith("../") || path.startsWith("#") ||
      path.startsWith("?")
    ) {
      return path;
    }

    //It's source file
    if (path.startsWith("~/")) {
      path = path.slice(1);

      //It's a page
      const page = this.pages.find((page) =>
        page.src.path + page.src.ext === path
      );

      if (page) {
        path = page.data.url;
      } else {
        //It's a static file
        const entry = this.source.isStatic(path);

        if (entry) {
          const [from, to] = entry;
          path = join(to, path.slice(from.length));
        } else {
          throw new Error(`Source file "${path}" not found`);
        }
      }
    } else {
      //Absolute urls are returned as is
      try {
        return new URL(path).toString();
      } catch {}
    }

    if (!this.options.location) {
      return join("/", path);
    }

    path = join(this.options.location.pathname, path);

    return absolute ? this.options.location.origin + path : path;
  }

  /**
   * Copy a static file
   */
  async #copyStatic(from, to) {
    const pathFrom = this.src(from);
    const pathTo = this.dest(to);

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

    //Group pages by renderOrder
    const renderOrder = {};

    for (const page of this.source.root.getPages()) {
      if (page.data.draft && !this.options.dev) {
        continue;
      }

      const order = page.data.renderOrder || 0;
      renderOrder[order] = renderOrder[order] || [];
      renderOrder[order].push(page);
    }

    const orderKeys = Object.keys(renderOrder).sort();

    for (const order of orderKeys) {
      const pages = [];
      const generators = [];

      //Prepare the pages
      for (const page of renderOrder[order]) {
        if (isGenerator(page.data.content)) {
          generators.push(page);
          continue;
        }

        this.#urlPage(page);
        pages.push(page);
        this.pages.push(page);
      }

      //Auto-generate pages
      for (const page of generators) {
        const generator = await this.engines.get(".tmpl.js")
          .render(
            page.data.content,
            {
              ...page.data,
              ...this.extraData,
            },
            this.src(page.src.path + page.src.ext),
          );

        for await (const data of generator) {
          if (!data.content) {
            data.content = null;
          }
          const newPage = page.duplicate(data);
          this.#urlPage(newPage);
          pages.push(newPage);
          this.pages.push(newPage);
        }
      }

      //Render all pages
      for (const page of pages) {
        page.content = await this.#renderPage(page);
      }
    }

    //Process the pages
    for (const [ext, processors] of this.processors) {
      await concurrent(
        this.pages,
        async (page) => {
          if (ext === page.dest.ext && page.content) {
            for (const process of processors) {
              await process(page, this);
            }
          }
        },
      );
    }

    //Save the pages
    await concurrent(
      this.pages,
      (page) => this.#savePage(page),
    );
  }

  /**
   * Generate the url and dest info of a page
   */
  #urlPage(page) {
    const { dest } = page;

    if (page.data.permalink) {
      let permalink = typeof page.data.permalink === "function"
        ? page.data.permalink(page)
        : page.data.permalink;
      const ext = extname(permalink);
      dest.ext = ext || ".html";

      //Relative permalink
      if (permalink.startsWith(".")) {
        permalink = join(dirname(dest.path), permalink);
      }
      dest.path = ext ? permalink.slice(0, -ext.length) : permalink;

      if (!ext && this.options.prettyUrls) {
        dest.path = join(dest.path, "index");
      }
    } else if (
      this.options.prettyUrls && dest.ext === ".html" &&
      basename(dest.path) !== "index"
    ) {
      dest.path = join(dest.path, "index");
    }

    if (!dest.path.startsWith("/")) {
      dest.path = `/${dest.path}`;
    }

    dest.path = slugify(dest.path);

    page.data.url = (dest.ext === ".html" && basename(dest.path) === "index")
      ? dest.path.slice(0, -5)
      : dest.path + dest.ext;
  }

  /**
   * Render a page
   */
  async #renderPage(page) {
    let content = page.data.content;
    let pageData = { ...page.data, ...this.extraData };
    let layout = pageData.layout;
    const path = this.src(page.src.path + page.src.ext);
    const engine = this.#getEngine(page.src.ext, pageData.templateEngine);

    if (Array.isArray(engine)) {
      for (const eng of engine) {
        content = await eng.render(content, pageData, path);
      }
    } else if (engine) {
      content = await engine.render(content, pageData, path);
    }

    while (layout) {
      const engine = this.#getEngine(layout);
      const layoutPath = this.src(engine.includes, layout);
      const layoutData = await engine.load(layoutPath);
      pageData = {
        ...layoutData,
        ...pageData,
        content,
        ...this.extraData,
      };

      content = await engine.render(layoutData.content, pageData, layoutPath);

      layout = layoutData.layout;
    }

    return content;
  }

  /**
   * Save a page
   */
  async #savePage(page) {
    //Ignore empty files
    if (!page.content) {
      return;
    }

    const sha1 = createHash("sha1");
    sha1.update(page.content);
    const hash = sha1.toString();

    const dest = page.dest.path + page.dest.ext;
    const previousHash = this.#hashes.get(dest);

    //The page content didn't change
    if (previousHash === hash) {
      return;
    }

    this.#hashes.set(dest, hash);

    console.log(`🔥 ${dest} ${gray(page.src.path + page.src.ext)}`);

    const filename = this.dest(dest);
    await ensureDir(dirname(filename));

    if (page.content instanceof Uint8Array) {
      return Deno.writeFile(filename, page.content);
    }

    return Deno.writeTextFile(filename, page.content);
  }

  /**
   * Get the engine used by a path or extension
   */
  #getEngine(path, custom) {
    if (custom) {
      custom = Array.isArray(custom) ? custom : custom.split(",");

      return custom.map((name) => {
        const engine = this.engines.get(`.${name.trim()}`);

        if (engine) {
          return engine;
        }

        throw new Error(`Invalid template engine: "${name}"`);
      });
    }

    const result = searchByExtension(path, this.engines);

    if (result) {
      return result[1];
    }
  }
}

function isGenerator(content) {
  if (typeof content !== "function") {
    return false;
  }

  const name = content.constructor.name;
  return (name === "GeneratorFunction" || name === "AsyncGeneratorFunction");
}
