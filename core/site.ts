import { join, posix, SEP } from "../deps/path.ts";
import Source from "./source.ts";
import {
  default as Scripts,
  ScriptOptions,
  ScriptOrFunction,
} from "./scripts.ts";
import Renderer from "./renderer.ts";
import { Writer } from "./writer.ts";
import textLoader from "./loaders/text.ts";
import Reader from "./reader.ts";
import PageLoader from "./source/page.ts";
import AssetLoader from "./source/asset.ts";
import DataLoader from "./source/data.ts";
import IncludesLoader from "./source/includes.ts";
import Processors from "./processors.ts";
import Scopes from "./scopes.ts";
import {
  default as Engines,
  Engine,
  Helper,
  HelperOptions,
} from "./engines.ts";
import Logger from "./logger.ts";
import {
  default as Events,
  Event,
  EventListener,
  EventOptions,
  EventType,
} from "./events.ts";
import {
  Loader,
  Page,
  Plugin,
  Processor,
  ScopeFilter,
  SiteOptions,
} from "../core.ts";
import {
  checkExtensions,
  concurrent,
  Exception,
  merge,
  normalizePath,
} from "./utils.ts";

const defaults: SiteOptions = {
  cwd: Deno.cwd(),
  src: "./",
  dest: "./_site",
  includes: "_includes",
  location: new URL("http://localhost"),
  quiet: false,
  dev: false,
  prettyUrls: true,
  server: {
    port: 3000,
    open: false,
    page404: "/404.html",
  },
  watcher: {
    ignore: [],
    debounce: 100,
  },
};

/**
 * This is the heart of Lume,
 * it contains everything needed to build the site
 */
export default class Site {
  options: SiteOptions;

  /** To output messages to the console */
  logger: Logger;

  /** To listen and dispatch events */
  events: Events;

  /** To run scripts */
  scripts: Scripts;

  /** To read the files from the filesystem */
  reader: Reader;

  /** To write the generated pages in the dest folder */
  writer: Writer;

  /** To load all _data files */
  dataLoader: DataLoader;

  /** To load all HTML pages */
  pageLoader: PageLoader;

  /** To load all non-HTML pages */
  assetLoader: AssetLoader;

  /** To load all _includes files (layouts, templates, etc) */
  includesLoader: IncludesLoader;

  /** To store and run the processors */
  processors: Processors;

  /** To store and run the pre-processors */
  preprocessors: Processors;

  /** To store and run the template engines */
  engines = new Engines();

  /** To scan the src folder */
  source: Source;

  /** To render the pages using any template engine */
  renderer: Renderer;
  
  /** To update pages of the same scope after any change */
  scopes: Scopes;

  /** The generated pages are stored here */
  pages: Page[] = [];


  constructor(options: Partial<SiteOptions> = {}) {
    this.options = merge(defaults, options);

    this.scopes = new Scopes();
    this.events = new Events();
    this.processors = new Processors();
    this.preprocessors = new Processors();
    this.logger = new Logger(this.options.quiet);

    const basePath = this.src();

    this.reader = new Reader(basePath);

    this.pageLoader = new PageLoader(this.reader);
    this.assetLoader = new AssetLoader(this.reader);
    this.dataLoader = new DataLoader(this.reader);
    this.includesLoader = new IncludesLoader(this.reader);
    this.includesLoader.defaultDir = this.options.includes;

    this.source = new Source({
      reader: this.reader,
      pageLoader: this.pageLoader,
      assetLoader: this.assetLoader,
      dataLoader: this.dataLoader,
    });

    this.scripts = new Scripts(this.logger, {
      cwd: this.options.cwd,
    });

    this.addEventListener("beforeBuild", () => {
      this.source.clearCache();
      this.reader.clearCache();
    });

    this.addEventListener("beforeUpdate", (ev: Event) => {
      this.source.clearCache();

      for (const filename of ev.files!) {
        this.reader.deleteCache(filename);
      }
    });

    this.renderer = new Renderer({
      includesLoader: this.includesLoader,
      prettyUrls: this.options.prettyUrls,
      preprocessors: this.preprocessors,
      engines: this.engines,
    });

    this.writer = new Writer({
      src: this.src(),
      dest: this.dest(),
      logger: this.logger,
    });

    // Ignore the dest directory if it's inside src
    if (this.dest().startsWith(this.src())) {
      this.ignore(this.options.dest);
    }

    // Ignore the dest folder by the watcher
    this.options.watcher.ignore.push(this.dest());
  }

  /**
   * Returns the full path to the src directory.
   * Use the arguments to return a subpath
   */
  src(...path: string[]) {
    return join(this.options.cwd, this.options.src, ...path);
  }

  /**
   * Returns the full path to the dest directory.
   * Use the arguments to return a subpath
   */
  dest(...path: string[]) {
    return join(this.options.cwd, this.options.dest, ...path);
  }

  /** Add a listener to an event */
  addEventListener(
    type: EventType,
    listener: EventListener | string,
    options?: EventOptions,
  ) {
    const fn = typeof listener === "string"
      ? () => this.run(listener)
      : listener;

    this.events.addEventListener(type, fn, options);
    return this;
  }

  /** Dispatch an event */
  dispatchEvent(event: Event) {
    return this.events.dispatchEvent(event);
  }

  /** Use a plugin */
  use(plugin: Plugin) {
    plugin(this);
    return this;
  }

  /**
   * Register a script or a function, so it can be executed with
   * lume run <name>
   */
  script(name: string, ...scripts: ScriptOrFunction[]) {
    this.scripts.add(name, ...scripts);
    return this;
  }

  /** Runs a script or function */
  async run(name: string, options: ScriptOptions = {}) {
    return await this.scripts.run(options, name);
  }

  /** Register a data loader for some extensions */
  loadData(extensions: string[], loader: Loader) {
    checkExtensions(extensions);
    extensions.forEach((extension) =>
      this.dataLoader.loaders.set(extension, loader)
    );
    return this;
  }

  /** Register a page loader for some extensions */
  loadPages(
    extensions: string[],
    loader: Loader = textLoader,
    engine?: Engine,
  ) {
    checkExtensions(extensions);
    extensions.forEach((extension) => {
      this.pageLoader.loaders.set(extension, loader);
      this.includesLoader.loaders.set(extension, loader);
    });

    if (engine) {
      this.engines.addEngine(extensions, engine);
    }
    return this;
  }

  /** Register an assets loader for some extensions */
  loadAssets(extensions: string[], loader: Loader = textLoader) {
    checkExtensions(extensions);
    extensions.forEach((extension) =>
      this.assetLoader.loaders.set(extension, loader)
    );
    return this;
  }

  /** Register an import path for some extensions  */
  includes(extensions: string[], path: string) {
    checkExtensions(extensions);

    extensions.forEach((extension) =>
      this.includesLoader.includes.set(extension, path)
    );
    return this;
  }

  /** Register a preprocessor for some extensions */
  preprocess(extensions: string[], preprocessor: Processor) {
    checkExtensions(extensions);
    this.preprocessors.processors.set(preprocessor, extensions);
    return this;
  }

  /** Register a processor for some extensions */
  process(extensions: string[], processor: Processor) {
    checkExtensions(extensions);
    this.processors.processors.set(processor, extensions);
    return this;
  }

  /** Register a template filter */
  filter(name: string, filter: Helper, async = false) {
    return this.helper(name, filter, { type: "filter", async });
  }

  /** Register a template helper */
  helper(name: string, fn: Helper, options: HelperOptions) {
    this.engines.addHelper(name, fn, options);
    return this;
  }

  /** Register extra data accessible by layouts */
  data(name: string, data: unknown) {
    this.engines.extraData[name] = data;
    return this;
  }

  /** Copy static files or directories without processing */
  copy(from: string, to = from) {
    this.source.addStaticFile(join("/", from), join("/", to));
    return this;
  }

  /** Ignore one or several files or directories */
  ignore(...paths: string[]) {
    paths.forEach((path) => this.source.addIgnoredPath(join("/", path)));
    return this;
  }

  /** Define independent scopes to optimize the update process */
  scopedUpdates(...scopes: ScopeFilter[]) {
    scopes.forEach((scope) => this.scopes.scopes.add(scope));
    return this;
  }

  /** Clear the dest directory */
  async clear() {
    await this.writer.clear();
  }

  /** Build the entire site */
  async build() {
    if (await this.dispatchEvent({ type: "beforeBuild" }) === false) {
      return;
    }

    await this.clear();

    for (const [from, to] of this.source.staticFiles) {
      await this.writer.copyFile(from, to);
    }

    await this.source.load();

    this.pages = [];

    const from = this.source.getPages(
      (page) => !page.data.draft || this.options.dev,
    );

    await this.renderer.renderPages(from, this.pages);
    await this.events.dispatchEvent({ type: "afterRender" });

    // Remove empty and ondemand pages
    this.pages = this.pages.filter((page) =>
      !!page.content && !page.data.ondemand
    );

    // Process the pages
    await this.processors.run(this.pages);

    if (await this.dispatchEvent({ type: "beforeSave" }) === false) {
      return;
    }

    // Save the pages
    await concurrent(
      this.pages,
      (page) => this.writer.savePage(page),
    );

    await this.dispatchEvent({ type: "afterBuild" });
  }

  /** Reload some files that might be changed */
  async update(files: Set<string>) {
    if (await this.dispatchEvent({ type: "beforeUpdate", files }) === false) {
      return;
    }

    for (const file of files) {
      // It's a static file
      const entry = this.#isStaticFile(file);

      if (entry) {
        const [from, to] = entry;

        await this.writer.copyFile(file, join(to, file.slice(from.length)));
        continue;
      }

      await this.source.reload(file);
    }

    const from = this.source.getPages(
      (page) => !page.data.draft || this.options.dev,
      this.scopes.getFilter(files),
    );

    await this.renderer.renderPages(from, this.pages);
    await this.events.dispatchEvent({ type: "afterRender" });

    // Process the pages
    await this.processors.run(this.pages);

    if (await this.dispatchEvent({ type: "beforeSave" }) === false) {
      return;
    }

    await concurrent(
      this.pages,
      (page) => this.writer.savePage(page),
    );
    await this.dispatchEvent({ type: "afterUpdate", files });
  }

  /** Render a single page (used for on demand rendering) */
  async renderPage(file: string): Promise<Page | undefined> {
    await this.source.reload(file);
    const page = this.source.getFileOrDirectory(file) as Page | undefined;

    if (!page) {
      return;
    }

    await this.dispatchEvent({ type: "beforeRenderOnDemand", page });
    await this.renderer.renderPageOnDemand(page);

    // Process the page
    await this.processors.run([page]);
    return page;
  }

  /** Return the URL of a page */
  url(path: string, absolute = false) {
    if (
      path.startsWith("./") || path.startsWith("../") ||
      path.startsWith("?") || path.startsWith("#") || path.startsWith("//")
    ) {
      return path;
    }

    // It's a source file
    if (path.startsWith("~/")) {
      path = path.slice(1).replaceAll("/", SEP);
      path = decodeURI(path);

      // It's a page
      const page = this.pages.find((page) =>
        page.src.path + page.src.ext === path
      );

      if (page) {
        path = page.data.url as string;
      } else {
        // It's a static file
        const entry = this.#isStaticFile(path);

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
   * Check whether a file is included in the list of static files
   * and return a [from, to] tuple
   */
  #isStaticFile(file: string) {
    for (const entry of this.source.staticFiles) {
      const [from] = entry;

      if (file.startsWith(from)) {
        return entry;
      }
    }

    return false;
  }
}
