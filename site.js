import { dirname, extname, join, posix, SEP } from "./deps/path.js";
import { copy, emptyDir, ensureDir, exists } from "./deps/fs.js";
import { gray } from "./deps/colors.js";
import { createHash } from "./deps/hash.js";
import Source from "./source.js";
import Scripts from "./scripts.js";
import Metrics from "./metrics.js";
import textLoader from "./loaders/text.js";
import {
  concurrent,
  Exception,
  merge,
  normalizePath,
  searchByExtension,
} from "./utils.js";

const defaults = {
  cwd: Deno.cwd(),
  src: "./",
  dest: "./_site",
  dev: false,
  metrics: false,
  prettyUrls: true,
  flags: [],
  server: {
    port: 3000,
    open: false,
    page404: "/404.html",
  },
};

export default class Site {
  engines = new Map();
  helpers = new Map();
  extraData = {};
  listeners = new Map();
  preprocessors = new Map();
  processors = new Map();
  pages = [];

  #hashes = new Map();

  constructor(options = {}) {
    this.options = merge(defaults, options);

    this.options.location = (options.location instanceof URL)
      ? this.options.location
      : new URL(this.options.location || "http://localhost");

    this.source = new Source(this);
    this.scripts = new Scripts(this);
    this.metrics = new Metrics(this);
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
  loadPages(extensions, loader, engine) {
    loader ||= textLoader;
    extensions.forEach((extension) => this.source.pages.set(extension, loader));

    if (!engine) {
      return this;
    }

    extensions.forEach((extension) => this.engines.set(extension, engine));

    for (const [name, helper] of this.helpers) {
      engine.addHelper(name, ...helper);
    }

    return this;
  }

  /**
   * Register an assets loader for some extensions
   */
  loadAssets(extensions, loader) {
    loader ||= textLoader;
    extensions.forEach((extension) => this.source.pages.set(extension, loader));
    extensions.forEach((extension) => this.source.assets.add(extension));
    return this;
  }

  /**
   * Register a preprocessor for some extensions
   */
  preprocess(extensions, preprocessor) {
    extensions.forEach((extension) => {
      const preprocessors = this.preprocessors.get(extension) || [];
      preprocessors.push(preprocessor);
      this.preprocessors.set(extension, preprocessors);
    });
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
   * Register a template filter
   */
  filter(name, filter, async) {
    return this.helper(name, filter, { type: "filter", async });
  }

  /**
   * Register a template helper
   */
  helper(name, fn, options) {
    this.helpers.set(name, [fn, options]);

    for (const engine of this.engines.values()) {
      engine.addHelper(name, fn, options);
    }

    return this;
  }

  /**
   * Register extra data accessible by layouts
   */
  data(name, data) {
    this.extraData[name] = data;
    return this;
  }

  /**
   * Copy static files or directories without processing
   */
  copy(from, to = from) {
    this.source.staticFiles.set(join("/", from), join("/", to));
    return this;
  }

  /**
   * Ignore one or several files or directories
   */
  ignore(...paths) {
    paths.forEach((path) => this.source.ignored.add(join("/", path)));
    return this;
  }

  /**
   * Clear the dest directory
   */
  async clear() {
    await emptyDir(this.dest());
    this.#hashes.clear();
  }

  /**
   * Build the entire site
   */
  async build() {
    this.metrics.start("Build (Entire site)");
    await this.dispatchEvent({ type: "beforeBuild" });

    await this.clear();

    this.metrics.start("Copy (All files)");
    for (const [from, to] of this.source.staticFiles) {
      await this.#copyStatic(from, to);
    }
    this.metrics.end("Copy (All files)");

    this.metrics.start("Load (All pages)");
    await this.source.loadDirectory();
    this.metrics.end("Load (All pages)");

    this.metrics.start("Preprocess + Render + Process (All pages)");
    await this.#buildPages();
    this.metrics.end("Preprocess + Render + Process (All pages)");

    await this.dispatchEvent({ type: "beforeSave" });

    // Save the pages
    this.metrics.start("Save (All pages)");
    await this.#savePages();
    this.metrics.end("Save (All pages)");

    await this.dispatchEvent({ type: "afterBuild" });
    this.metrics.end("Build (Entire site)");
  }

  /**
   * Reload some files that might be changed
   */
  async update(files) {
    await this.dispatchEvent({ type: "beforeUpdate", files });

    for (const file of files) {
      // It's an ignored file
      if (this.source.isIgnored(file)) {
        continue;
      }

      const normalized = normalizePath(file);

      // It's inside a _data file or directory
      if (/\/_data(?:\.\w+$|\/)/.test(normalized)) {
        await this.source.loadFile(file);
        continue;
      }

      // The path contains /_ or /.
      if (normalized.includes("/_") || normalized.includes("/.")) {
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
    }

    await this.#buildPages();
    await this.dispatchEvent({ type: "beforeSave" });
    await this.#savePages();
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
   * Returns the URL of a page
   *
   * @param {string} path
   * @param {bool} absolute
   */
  url(path, absolute) {
    if (
      path.startsWith("./") || path.startsWith("../") ||
      path.startsWith("?") || path.startsWith("#")
    ) {
      return path;
    }

    // It's source file
    if (path.startsWith("~/")) {
      path = path.slice(1).replaceAll("/", SEP);

      // It's a page
      const page = this.pages.find((page) =>
        page.src.path + page.src.ext === path
      );

      if (page) {
        path = page.data.url;
      } else {
        // It's a static file
        const entry = this.source.isStatic(path);

        if (entry) {
          const [from, to] = entry;
          path = normalizePath(join(to, path.slice(from.length)));
        } else {
          throw new Exception("Source file not found", { path });
        }
      }
    } else {
      // Absolute URLs are returned as is
      try {
        return new URL(path).href;
      } catch {
        // Ignore error
      }
    }

    if (!path.startsWith(this.options.location.pathname)) {
      path = posix.join(this.options.location.pathname, path);
    }

    return absolute ? this.options.location.origin + path : path;
  }

  /**
   * Copy a static file
   */
  async #copyStatic(from, to) {
    this.metrics.start("Copy", from);
    const pathFrom = this.src(from);
    const pathTo = this.dest(to);

    if (await exists(pathFrom)) {
      await ensureDir(dirname(pathTo));
      console.log(`🔥 ${normalizePath(to)} ${gray(from)}`);
      return copy(pathFrom, pathTo, { overwrite: true });
    }
    this.metrics.end("Copy", from);
  }

  /**
   * Build the pages
   */
  async #buildPages() {
    this.pages = [];

    // Group pages by renderOrder
    const renderOrder = {};

    this.metrics.start("Preprocess + Render (All pages)");

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

      // Prepare the pages
      for (const page of renderOrder[order]) {
        if (isGenerator(page.data.content)) {
          generators.push(page);
          continue;
        }

        this.#urlPage(page);
        pages.push(page);
        this.pages.push(page);
      }

      // Auto-generate pages
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

      // Preprocess the pages
      for (const [ext, preprocessors] of this.preprocessors) {
        await concurrent(
          this.pages,
          async (page) => {
            if (ext === page.src.ext || ext === page.dest.ext) {
              for (const preprocess of preprocessors) {
                this.metrics.start("Preprocess", page, preprocess);
                await preprocess(page, this);
                this.metrics.end("Preprocess", page, preprocess);
              }
            }
          },
        );
      }

      // Render all pages
      for (const page of pages) {
        try {
          this.metrics.start("Render", page);
          page.content = await this.#renderPage(page);
          this.metrics.end("Render", page);
        } catch (err) {
          throw new Exception("Error rendering this page", { page }, err);
        }
      }
    }

    await this.dispatchEvent({ type: "afterRender" });

    this.metrics.end("Preprocess + Render (All pages)");

    this.metrics.start("Process (All pages)");
    // Process the pages
    for (const [ext, processors] of this.processors) {
      await concurrent(
        this.pages,
        async (page) => {
          if (ext === page.dest.ext && page.content) {
            for (const process of processors) {
              this.metrics.start("Process", page, process);
              await process(page, this);
              this.metrics.end("Process", page, process);
            }
          }
        },
      );
    }
    this.metrics.end("Process (All pages)");
  }

  /**
   * Save all pages
   */
  async #savePages() {
    await concurrent(
      this.pages,
      (page) => this.#savePage(page),
    );
  }

  /**
   * Generate the URL and dest info of a page
   */
  #urlPage(page) {
    const { dest } = page;
    let url = page.data.url;

    if (typeof url === "function") {
      url = url(page);
    }

    if (typeof url === "string") {
      // Relative URL
      if (url.startsWith("./") || url.startsWith("../")) {
        url = posix.join(dirname(page.dest.path), url);
      } else if (!url.startsWith("/")) {
        throw new Exception(
          `The url variable must start with "/", "./" or "../"`,
          { page, url },
        );
      }

      if (url.endsWith("/")) {
        dest.path = `${url}index`;
        dest.ext = ".html";
      } else {
        dest.ext = extname(url);
        dest.path = dest.ext ? url.slice(0, -dest.ext.length) : url;
      }
    } else if (!dest.ext) {
      if (this.options.prettyUrls && posix.basename(dest.path) !== "index") {
        dest.path = posix.join(dest.path, "index");
      }
      dest.ext = ".html";
    }

    page.data.url =
      (dest.ext === ".html" && posix.basename(dest.path) === "index")
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
    const engine = this.#getEngine(path, pageData.templateEngine);

    if (Array.isArray(engine)) {
      for (const eng of engine) {
        content = await eng.render(content, pageData, path);
      }
    } else if (engine) {
      content = await engine.render(content, pageData, path);
    }

    while (layout) {
      const result = searchByExtension(layout, this.source.pages);

      if (!result) {
        throw new Exception(
          "Couldn't find a loader for this layout",
          { layout },
        );
      }

      const layoutPath = this.src("_includes", layout);
      const layoutData = await this.source.load(layoutPath, result[1]);
      const engine = this.#getEngine(layout, layoutData.templateEngine);

      if (!engine) {
        throw new Exception(
          "Couldn't find a template engine for this layout",
          { layout },
        );
      }

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
    // Ignore empty files
    if (!page.content) {
      return;
    }
    this.metrics.start("Save", page);
    const sha1 = createHash("sha1");
    sha1.update(page.content);
    const hash = sha1.toString();

    const dest = page.dest.path + page.dest.ext;
    const previousHash = this.#hashes.get(dest);

    // The page content didn't change
    if (previousHash === hash) {
      return;
    }

    this.#hashes.set(dest, hash);

    const src = page.src.path ? page.src.path + page.src.ext : "(generated)";
    console.log(`🔥 ${dest} ${gray(src)}`);

    const filename = this.dest(dest);
    await ensureDir(dirname(filename));

    page.content instanceof Uint8Array
      ? await Deno.writeFile(filename, page.content)
      : await Deno.writeTextFile(filename, page.content);

    this.metrics.end("Save", page);
  }

  /**
   * Get the engine used by a path or extension
   */
  #getEngine(path, templateEngine) {
    if (templateEngine) {
      templateEngine = Array.isArray(templateEngine)
        ? templateEngine
        : templateEngine.split(",");

      return templateEngine.map((name) => {
        const engine = this.engines.get(`.${name.trim()}`);

        if (engine) {
          return engine;
        }

        throw new Exception(
          "Invalid value for templateEngine",
          { path, templateEngine },
        );
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
