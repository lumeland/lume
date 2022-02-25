import { join, posix, SEP } from "../deps/path.ts";
import { merge, normalizePath } from "./utils.ts";
import { Exception } from "./errors.ts";

import Reader from "./reader.ts";
import PageLoader from "./page_loader.ts";
import ComponentLoader from "./component_loader.ts";
import Components from "./components.ts";
import DataLoader from "./data_loader.ts";
import IncludesLoader from "./includes_loader.ts";
import Source from "./source.ts";
import StaticFiles from "./static_files.ts";
import Engines from "./engines.ts";
import Scopes from "./scopes.ts";
import Processors from "./processors.ts";
import Renderer from "./renderer.ts";
import Events from "./events.ts";
import Formats from "./formats.ts";
import Logger from "./logger.ts";
import Scripts from "./scripts.ts";
import Writer from "./writer.ts";
import textLoader from "./loaders/text.ts";

import type {
  Data,
  Engine,
  Event,
  EventListener,
  EventOptions,
  Helper,
  HelperOptions,
  Loader,
  Middleware,
  Page,
  Plugin,
  Processor,
  ScopeFilter,
  ScriptOptions,
  ScriptOrFunction,
} from "../core.ts";

/** Default options of the site */
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
  components: {
    directory: "/_components",
    variable: "comp",
    cssFile: "/components.css",
    jsFile: "/components.js",
  },
};

/**
 * This is the heart of Lume,
 * it contains everything needed to build the site
 */
export default class Site {
  options: SiteOptions;

  /** To read the files from the filesystem */
  reader: Reader;

  /** Info about how to handle different file formats */
  formats: Formats;

  /** To load all pages */
  pageLoader: PageLoader;

  /** To load all _data files */
  dataLoader: DataLoader;

  /** To load all _includes files (layouts, templates, etc) */
  includesLoader: IncludesLoader;

  /** To load reusable components */
  componentLoader: ComponentLoader;

  /** To manage and use loaded components */
  components: Components;

  /** To scan the src folder */
  source: Source;

  /** To handle the static files */
  staticFiles: StaticFiles;

  /** To store and run the template engines */
  engines: Engines;

  /** To update pages of the same scope after any change */
  scopes: Scopes;

  /** To store and run the processors */
  processors: Processors;

  /** To store and run the pre-processors */
  preprocessors: Processors;

  /** To render the pages using any template engine */
  renderer: Renderer;

  /** To listen and dispatch events */
  events: Events<SiteEvent>;

  /** To output messages to the console */
  logger: Logger;

  /** To run scripts */
  scripts: Scripts;

  /** To write the generated pages in the dest folder */
  writer: Writer;

  /** Global data to be passed to the engines */
  globalData: Data = {};

  /** The generated pages are stored here */
  pages: Page[] = [];

  constructor(options: Partial<SiteOptions> = {}) {
    this.options = merge(defaults, options);

    const src = this.src();
    const dest = this.dest();
    const { globalData } = this;
    const { quiet, includes, cwd, prettyUrls } = this.options;
    const { cssFile, jsFile } = this.options.components;

    // To load source files
    const reader = new Reader({ src });
    const formats = new Formats();

    const pageLoader = new PageLoader({ reader, formats });
    const dataLoader = new DataLoader({ reader, formats });
    const includesLoader = new IncludesLoader({ reader, includes, formats });
    const componentLoader = new ComponentLoader({ reader, formats });
    const components = new Components({ globalData, cssFile, jsFile });
    const source = new Source({
      reader,
      pageLoader,
      dataLoader,
    });
    const staticFiles = new StaticFiles();

    // To render pages
    const engines = new Engines({ formats });
    const scopes = new Scopes();
    const processors = new Processors();
    const preprocessors = new Processors();
    const renderer = new Renderer({
      includesLoader,
      prettyUrls,
      preprocessors,
      engines,
      defaultLayout: this.options.defaultLayout,

    });

    // Other stuff
    const events = new Events<SiteEvent>();
    const logger = new Logger({ quiet });
    const scripts = new Scripts({ logger, options: { cwd } });
    const writer = new Writer({ src, dest, logger });

    // Save everything in the site instance
    this.reader = reader;
    this.formats = formats;
    this.pageLoader = pageLoader;
    this.componentLoader = componentLoader;
    this.components = components;
    this.dataLoader = dataLoader;
    this.includesLoader = includesLoader;
    this.source = source;
    this.staticFiles = staticFiles;
    this.engines = engines;
    this.scopes = scopes;
    this.processors = processors;
    this.preprocessors = preprocessors;
    this.renderer = renderer;
    this.events = events;
    this.logger = logger;
    this.scripts = scripts;
    this.writer = writer;

    // Ignore the "dest" directory if it's inside src
    if (this.dest().startsWith(this.src())) {
      this.ignore(this.options.dest);
    }

    // Ignore components directory
    this.ignore(this.options.components.directory);

    // Ignore the dest and .git folder by the watcher
    this.options.watcher.ignore.push(this.options.dest);
    this.options.watcher.ignore.push(".git");
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
    type: SiteEventType,
    listener: EventListener<SiteEvent> | string,
    options?: EventOptions,
  ) {
    const fn = typeof listener === "string"
      ? () => this.run(listener)
      : listener;

    this.events.addEventListener(type, fn, options);
    return this;
  }

  /** Dispatch an event */
  dispatchEvent(event: SiteEvent) {
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
    this.scripts.set(name, ...scripts);
    return this;
  }

  /** Runs a script or function registered previously */
  async run(name: string, options: ScriptOptions = {}) {
    return await this.scripts.run(options, name);
  }

  /** Register a data loader for some extensions */
  loadData(extensions: string[], loader: Loader) {
    extensions.forEach((extension) => {
      this.formats.set(extension, { dataLoader: loader });
    });
    return this;
  }

  /** Register a page loader for some extensions */
  loadPages(
    extensions: string[],
    loader: Loader = textLoader,
    engine?: Engine,
  ) {
    extensions.forEach((extension) => {
      this.formats.set(extension, {
        pageLoader: loader,
        includesLoader: loader,
        pageType: "page",
      });
    });

    if (engine) {
      this.engine(extensions, engine);
    }

    return this;
  }

  /** Register an assets loader for some extensions */
  loadAssets(extensions: string[], loader: Loader = textLoader) {
    extensions.forEach((extension) => {
      this.formats.set(extension, {
        pageLoader: loader,
        pageType: "asset",
      });
    });

    return this;
  }

  /** Register a component loader for some extensions */
  loadComponents(
    extensions: string[],
    loader: Loader = textLoader,
    engine: Engine,
  ) {
    extensions.forEach((extension) => {
      this.formats.set(extension, {
        componentLoader: loader,
        componentEngine: engine,
      });
    });

    return this;
  }

  /** Register an import path for some extensions  */
  includes(extensions: string[], path: string) {
    extensions.forEach((extension) => {
      this.formats.set(extension, {
        includesPath: path,
      });
    });

    this.ignore(path); // Ignore any includes folder
    return this;
  }

  /** Register a engine for some extensions  */
  engine(extensions: string[], engine: Engine) {
    extensions.forEach((extension) => {
      this.formats.set(extension, { engine });
    });

    for (const [name, helper] of this.engines.helpers) {
      engine.addHelper(name, ...helper);
    }

    return this;
  }

  /** Register a preprocessor for some extensions */
  preprocess(extensions: string[] | "*", preprocessor: Processor) {
    this.preprocessors.set(extensions, preprocessor);
    return this;
  }

  /** Register a processor for some extensions */
  process(extensions: string[] | "*", processor: Processor) {
    this.processors.set(extensions, processor);
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
    this.globalData[name] = data;
    return this;
  }

  /** Copy static files or directories without processing */
  copy(from: string, to = from) {
    this.staticFiles.add(from, to);
    this.ignore(from); // Ignore static paths
    return this;
  }

  /** Ignore one or several files or directories */
  ignore(...paths: string[]) {
    paths.forEach((path) => this.source.addIgnoredPath(path));
    return this;
  }

  /** Define independent scopes to optimize the update process */
  scopedUpdates(...scopes: ScopeFilter[]) {
    scopes.forEach((scope) => this.scopes.scopes.add(scope));
    return this;
  }

  /** Clear the dest directory and any cache */
  async clear() {
    this.source.clearCache();
    this.reader.clearCache();
    await this.writer.clear();
  }

  /** Build the entire site */
  async build() {
    if (await this.dispatchEvent({ type: "beforeBuild" }) === false) {
      return;
    }

    await this.clear();

    // Copy static files
    for (const [from, to] of this.staticFiles.paths) {
      await this.writer.copyFile(from, to);
    }

    // Load source files
    await this.source.load();

    // Load the components and save them in the a global variable
    const { variable, directory } = this.options.components;
    const components = await this.componentLoader.load(directory);

    if (components) {
      this.data(variable, this.components.toProxy(components));
    }

    // Assign the global data
    for (const [name, data] of Object.entries(this.globalData)) {
      this.source.root!.data[name] = data;
    }

    // Get all pages to process (ignore drafts)
    const pagesToBuild = this.source.getPages(
      (page) => !page.data.draft || this.options.dev,
    );

    // Build the pages
    const pages = await this.#buildPages(pagesToBuild);
    await this.dispatchEvent({ type: "afterBuild", pages });
  }

  /** Reload some files that might be changed */
  async update(files: Set<string>) {
    if (await this.dispatchEvent({ type: "beforeUpdate", files }) === false) {
      return;
    }

    // Clear the cache before every file change
    this.source.clearCache();

    // Load the components and save them in the a global variable
    const { variable, directory } = this.options.components;
    const components = await this.componentLoader.load(directory);

    if (components) {
      this.data(variable, this.components.toProxy(components));
    }

    // Assign the global data
    for (const [name, data] of Object.entries(this.globalData)) {
      this.source.root!.data[name] = data;
    }

    // Reload the changed files
    for (const file of files) {
      // Delete the file from the cache
      this.reader.deleteCache(file);
      this.formats.deleteCache(file);

      // It's a static file
      const entry = this.staticFiles.search(file);

      if (entry) {
        const [from, to] = entry;

        await this.writer.copyFile(from, to);
        continue;
      }

      await this.source.update(file);
    }

    // Get the selected pages to process (ignore drafts and non scoped pages)
    const pagesToBuild = this.source.getPages(
      (page) => !page.data.draft || this.options.dev,
      this.scopes.getFilter(files),
    );

    // Rebuild the selected pages
    const pages = await this.#buildPages(pagesToBuild);
    await this.dispatchEvent({ type: "afterUpdate", files, pages });
  }

  /**
   * Internal function to render pages
   * The common operations of build and update
   * Returns the list of pages that have been built
   */
  async #buildPages(pages: Page[]): Promise<Page[]> {
    // Render the pages into this.pages array
    this.pages = [];
    await this.renderer.renderPages(pages, this.pages);
    await this.events.dispatchEvent({ type: "afterRender" });

    // Adds the components assets to the list of pages
    this.components.addAssets(this.pages);

    // Remove empty pages and ondemand pages
    this.pages = this.pages.filter((page) =>
      !!page.content && !page.data.ondemand
    );

    // Run the processors to the pages
    await this.processors.run(this.pages);

    if (await this.dispatchEvent({ type: "beforeSave" }) === false) {
      return [];
    }

    // Save the pages in the dest folder
    return this.writer.savePages(this.pages);
  }

  /** Render a single page (used for on demand rendering) */
  async renderPage(file: string): Promise<Page | undefined> {
    // Load the page
    await this.source.update(file);

    // Returns the page
    const page = this.source.getFileOrDirectory(file) as Page | undefined;

    if (!page) {
      return;
    }

    await this.dispatchEvent({ type: "beforeRenderOnDemand", page });

    // Render the page
    await this.renderer.renderPageOnDemand(page);

    // Run the processors to the page
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
        const entry = this.staticFiles.search(path);

        if (entry) {
          const [, to] = entry;
          path = normalizePath(to);
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
}

/** The options to configure the site build */
export interface SiteOptions {
  /** The path of the current working directory */
  cwd: string;

  /** The path of the site source */
  src: string;

  /** The path of the built destination */
  dest: string;

  /** The default includes path */
  includes: string;

  /** Set `true` to enable the `dev` mode */
  dev: boolean;

  /** The site location (used to generate final urls) */
  location: URL;

  /** Set true to generate pretty urls (`/about-me/`) */
  prettyUrls: boolean;

  /** Set `true` to skip logs */
  quiet: boolean;

  /** The local server options */
  server: ServerOptions;

  /** The local watcher options */
  watcher: WatcherOptions;

  /** The components options */
  components: ComponentsOptions;

  /** The layout option */
  defaultLayout?: string;
}

/** The options to configure the local server */
export interface ServerOptions {
  /** The port to listen on */
  port: number;

  /** To open the server in a browser */
  open: boolean;

  /** The file to serve on 404 error */
  page404: string;

  /** Optional for the server */
  middlewares?: Middleware[];
}

/** The options to configure the local watcher */
export interface WatcherOptions {
  /** Files or folders to ignore by the watcher */
  ignore: string[];

  /** The interval in milliseconds to check for changes */
  debounce: number;
}

/** The options to configure the components */
export interface ComponentsOptions {
  /** Directory in the src folder where are the components files */
  directory: string;

  /** The variable name used to access to the components */
  variable: string;

  /** The name of the file to save the components css code */
  cssFile: string;

  /** The name of the file to save the components javascript code */
  jsFile: string;
}

/** Custom events for site build */
export interface SiteEvent extends Event {
  /** The event type */
  type: SiteEventType;

  /**
   * Available only in "beforeUpdate" and "afterUpdate"
   * contains the files that were changed
   */
  files?: Set<string>;

  /**
   * Available only in "beforeRenderOnDemand"
   * contains the page that will be rendered
   */
  page?: Page;

  /**
   * Available only in "afterBuild" and "afterUpdate"
   * contains the list of pages that have been saved
   */
  pages?: Page[];
}

/** The available event types */
export type SiteEventType =
  | "beforeBuild"
  | "afterBuild"
  | "beforeUpdate"
  | "afterUpdate"
  | "afterRender"
  | "beforeRenderOnDemand"
  | "beforeSave";
