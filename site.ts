import { dirname, extname, join, posix, SEP } from "./deps/path.ts";
import { copy, emptyDir, ensureDir, exists } from "./deps/fs.ts";
import { gray } from "./deps/colors.ts";
import { createHash } from "./deps/hash.ts";
import Source from "./source.ts";
import { Page } from "./filesystem.ts";
import Scripts from "./scripts.ts";
import Metrics from "./metrics.js";
import Engine from "./engines/template_engine.ts";
import textLoader from "./loaders/text.ts";
import {
  concurrent,
  Exception,
  merge,
  normalizePath,
  searchByExtension,
} from "./utils.ts";

import { Command, Event, Loader, PluginSetup, SiteOptions, HelperOptions, Processor } from "./types.ts";

const defaults: SiteOptions = {
  cwd: Deno.cwd(),
  src: "./",
  dest: "./_site",
  dev: false,
  location: "http://localhost",
  metrics: false,
  prettyUrls: true,
  flags: [],
  verbose: 1,
  server: {
    port: 3000,
    open: false,
    page404: "/404.html",
  },
};

export default class Site {
  options: SiteOptions;
  source: Source;
  scripts: Scripts;
  metrics: Metrics;
  engines: Map<string, Engine> = new Map();
  helpers = new Map();
  extraData: Record<string, unknown> = {};
  listeners: Map<string, Set<Function | string>> = new Map();
  preprocessors: Map<string, Processor[]> = new Map();
  processors: Map<string, Processor[]> = new Map();
  pages: Page[] = [];

  #hashes = new Map();

  constructor(options: Record<string, unknown> = {}) {
    this.options = merge(defaults, options);

    this.options.location = (options.location instanceof URL)
      ? options.location
      : new URL(options.location || "http://localhost");

    this.source = new Source(this);
    this.scripts = new Scripts(this);
    this.metrics = new Metrics(this);
  }

  /**
   * Returns the src path
   */
  src(...path: string[]) {
    return join(this.options.cwd, this.options.src, ...path);
  }

  /**
   * Returns the dest path
   */
  dest(...path: string[]) {
    return join(this.options.cwd, this.options.dest, ...path);
  }

  /**
   * Adds an event
   */
  addEventListener(type: string, listener: ((event: Event) => unknown) | string) {
    const listeners = this.listeners.get(type) || new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
    return this;
  }

  /**
   * Dispatch an event
   */
  async dispatchEvent(event: Event) {
    const type = event.type;
    const listeners = this.listeners.get(type);

    if (!listeners) {
      return;
    }

    for (let listener of listeners) {
      const callback = typeof listener === "string" ? [listener] : listener;

      if (Array.isArray(callback)) {
        const success = await this.run(...callback);

        if (!success) {
          return false;
        }

        continue;
      }

      if (await callback(event) === false) {
        return false;
      }
    }
  }

  /**
   * Use a plugin
   */
  use(plugin: PluginSetup) {
    plugin(this);
    return this;
  }

  /**
   * Register a script
   */
  script(name: string, ...scripts: Command[]) {
    this.scripts.set(name, ...scripts);
    return this;
  }

  /**
   * Register a data loader for some extensions
   */
  loadData(extensions: string[], loader: Loader) {
    extensions.forEach((extension) => this.source.data.set(extension, loader));
    return this;
  }

  /**
   * Register a page loader for some extensions
   */
  loadPages(extensions: string[], loader?: Loader, engine?: Engine) {
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
  loadAssets(extensions: string[], loader: Loader) {
    loader ||= textLoader;
    extensions.forEach((extension) => this.source.pages.set(extension, loader));
    extensions.forEach((extension) => this.source.assets.add(extension));
    return this;
  }

  /**
   * Register a preprocessor for some extensions
   */
  preprocess(extensions: string[], preprocessor: Processor) {
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
  process(extensions: string[], processor: Processor) {
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
  filter(name: string, filter: (...args: unknown[]) => unknown, async = false) {
    return this.helper(name, filter, { type: "filter", async });
  }

  /**
   * Register a template helper
   */
  helper(name: string, fn: (...args: unknown[]) => unknown, options: HelperOptions) {
    this.helpers.set(name, [fn, options]);

    for (const engine of this.engines.values()) {
      engine.addHelper(name, fn, options);
    }

    return this;
  }

  /**
   * Register extra data accessible by layouts
   */
  data(name: string, data: unknown) {
    this.extraData[name] = data;
    return this;
  }

  /**
   * Copy static files or directories without processing
   */
  copy(from: string, to = from) {
    this.source.staticFiles.set(join("/", from), join("/", to));
    return this;
  }

  /**
   * Ignore one or several files or directories
   */
  ignore(...paths: string[]) {
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
  async build(watchMode = false) {
    this.metrics.start("Build (entire site)");
    await this.dispatchEvent({ type: "beforeBuild" });

    await this.clear();

    this.metrics.start("Copy (all files)");
    for (const [from, to] of this.source.staticFiles) {
      await this.#copyStatic(from, to);
    }
    this.metrics.end("Copy (all files)");

    this.metrics.start("Load (all pages)");
    await this.source.loadDirectory();
    this.metrics.end("Load (all pages)");

    this.metrics.start("Preprocess + render + process (all pages)");
    await this.#buildPages();
    this.metrics.end("Preprocess + render + process (all pages)");

    await this.dispatchEvent({ type: "beforeSave" });

    // Save the pages
    this.metrics.start("Save (all pages)");
    await this.#savePages(watchMode);
    this.metrics.end("Save (all pages)");

    this.metrics.end("Build (entire site)");
    await this.dispatchEvent({ type: "afterBuild" });
  }

  /**
   * Reload some files that might be changed
   */
  async update(files: string[]) {
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
    await this.#savePages(true);
    await this.dispatchEvent({ type: "afterUpdate", files });
  }

  /**
   * Run a script
   */
  async run(name: string, options = {}) {
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
   */
  url(path: string, absolute: boolean) {
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
  async #copyStatic(from: string, to: string) {
    this.metrics.start("Copy", from);
    const pathFrom = this.src(from);
    const pathTo = this.dest(to);

    if (await exists(pathFrom)) {
      await ensureDir(dirname(pathTo));
      if (this.options.verbose > 0) {
        console.log(`🔥 ${normalizePath(to)} ${gray(from)}`);
      }
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
    const renderOrder: Record<number, Page[]> = {};

    this.metrics.start("Preprocess + render (all pages)");

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
          pages,
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
      await concurrent(
        pages,
        async (page) => {
          try {
            this.metrics.start("Render", page);
            page.content = await this.#renderPage(page);
            this.metrics.end("Render", page);
          } catch (err) {
            throw new Exception("Error rendering this page", { page }, err);
          }
        },
      );
    }

    await this.dispatchEvent({ type: "afterRender" });

    this.metrics.end("Preprocess + render (all pages)");

    this.metrics.start("Process (all pages)");
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
    this.metrics.end("Process (all pages)");
  }

  /**
   * Save all pages
   */
  async #savePages(watchMode: boolean) {
    await concurrent(
      this.pages,
      (page) => this.#savePage(page, watchMode),
    );
  }

  /**
   * Generate the URL and dest info of a page
   */
  #urlPage(page: Page) {
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
  async #renderPage(page: Page) {
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
  async #savePage(page: Page, watchMode: boolean) {
    // Ignore empty files
    if (!page.content) {
      return;
    }

    this.metrics.start("Save", page);

    const dest = page.dest.path + page.dest.ext;

    if (watchMode) {
      const sha1 = createHash("sha1");
      sha1.update(page.content);
      const hash = sha1.toString();
      const previousHash = this.#hashes.get(dest);

      // The page content didn't change
      if (previousHash === hash) {
        return;
      }

      this.#hashes.set(dest, hash);
    }

    if (this.options.verbose > 0) {
      const src = page.src.path ? page.src.path + page.src.ext : "(generated)";
      console.log(`🔥 ${dest} ${gray(src)}`);
    }

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
  #getEngine(path: string, templateEngine?: string | string[]) {
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

function isGenerator(content: unknown) {
  if (typeof content !== "function") {
    return false;
  }

  const name = content.constructor.name;
  return (name === "GeneratorFunction" || name === "AsyncGeneratorFunction");
}
