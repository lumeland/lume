import { join, posix } from "../deps/path.ts";
import { merge, normalizePath } from "./utils.ts";
import { Exception } from "./errors.ts";

import Reader from "./reader.ts";
import PageLoader from "./page_loader.ts";
import ComponentLoader from "./component_loader.ts";
import DataLoader from "./data_loader.ts";
import IncludesLoader from "./includes_loader.ts";
import Source from "./source.ts";
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
  Component,
  Components,
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
  StaticFile,
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

  /** Internal data. Used to save arbitrary data by plugins and processors */
  _data: Record<string, unknown> = {};

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

  /** To scan the src folder */
  source: Source;

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

  /** Global data shared by all pages */
  globalData: Data = {};

  /** Global components shared by all templates */
  globalComponents: Components = new Map();

  /** The generated pages are stored here */
  readonly pages: Page[] = [];

  /** Pages that should be rendered on demand */
  readonly onDemandPages: Page[] = [];

  /** The static files to be copied are stored here */
  readonly files: StaticFile[] = [];

  constructor(options: Partial<SiteOptions> = {}) {
    this.options = merge(defaults, options);

    const src = this.src();
    const dest = this.dest();
    const { quiet, includes, cwd, prettyUrls, components } = this.options;

    // To load source files
    const reader = new Reader({ src });
    const formats = new Formats();

    const pageLoader = new PageLoader({ reader });
    const dataLoader = new DataLoader({ reader, formats });
    const includesLoader = new IncludesLoader({ reader, includes });
    const componentLoader = new ComponentLoader({ reader, formats });
    const source = new Source({
      reader,
      pageLoader,
      dataLoader,
      componentLoader,
      formats,
      components,
    });

    // To render pages
    const scopes = new Scopes();
    const processors = new Processors();
    const preprocessors = new Processors();
    const renderer = new Renderer({
      includesLoader,
      prettyUrls,
      preprocessors,
      formats,
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
    this.dataLoader = dataLoader;
    this.includesLoader = includesLoader;
    this.source = source;
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

    // Ignore the dest folder by the watcher
    this.options.watcher.ignore.push(this.options.dest);
  }

  /**
   * Returns the full path to the root directory.
   * Use the arguments to return a subpath
   */
  root(...path: string[]): string {
    return normalizePath(join(this.options.cwd, ...path));
  }

  /**
   * Returns the full path to the src directory.
   * Use the arguments to return a subpath
   */
  src(...path: string[]): string {
    return this.root(this.options.src, ...path);
  }

  /**
   * Returns the full path to the dest directory.
   * Use the arguments to return a subpath
   */
  dest(...path: string[]): string {
    return this.root(this.options.dest, ...path);
  }

  /** Add a listener to an event */
  addEventListener(
    type: SiteEventType,
    listener: EventListener<SiteEvent> | string,
    options?: EventOptions,
  ): this {
    const fn = typeof listener === "string"
      ? () => this.run(listener)
      : listener;

    this.events.addEventListener(type, fn, options);
    return this;
  }

  /** Dispatch an event */
  dispatchEvent(event: SiteEvent): Promise<boolean> {
    return this.events.dispatchEvent(event);
  }

  /** Use a plugin */
  use(plugin: Plugin): this {
    plugin(this);
    return this;
  }

  /**
   * Register a script or a function, so it can be executed with
   * lume run <name>
   */
  script(name: string, ...scripts: ScriptOrFunction[]): this {
    this.scripts.set(name, ...scripts);
    return this;
  }

  /** Runs a script or function registered previously */
  async run(name: string, options: ScriptOptions = {}): Promise<boolean> {
    return await this.scripts.run(options, name);
  }

  /**
   * Register a data loader for some extensions
   */
  loadData(extensions: string[], dataLoader: Loader = textLoader): this {
    extensions.forEach((ext) => {
      this.formats.set({ ext, dataLoader });
    });

    return this;
  }

  /**
   * Register a page loader for some extensions
   */
  loadPages(
    extensions: string[],
    pageLoader: Loader = textLoader,
    engine?: Engine,
  ): this {
    extensions.forEach((ext) => {
      this.formats.set({ ext, pageLoader });
    });

    if (engine) {
      this.engine(extensions, engine);
    }

    return this;
  }

  /**
   * Register an assets loader for some extensions
   */
  loadAssets(extensions: string[], pageLoader: Loader = textLoader): this {
    extensions.forEach((ext) => {
      this.formats.set({
        ext,
        pageLoader,
        asset: true,
      });
    });

    return this;
  }

  /**
   * Register a component loader for some extensions
   */
  loadComponents(
    extensions: string[],
    componentLoader: Loader = textLoader,
    engine: Engine,
  ): this {
    extensions.forEach((ext) => {
      this.formats.set({ ext, componentLoader });
    });
    this.engine(extensions, engine);
    return this;
  }

  /** Register an import path for some extensions  */
  includes(extensions: string[], path: string): this {
    extensions.forEach((ext) => {
      this.formats.set({ ext, includesPath: path });
    });

    // Ignore any includes folder
    return this.ignore(path);
  }

  /** Register the engines for some extensions  */
  engine(extensions: string[], ...engines: Engine[]): this {
    extensions.forEach((ext) => {
      this.formats.set({ ext, engines });
    });

    for (const [name, helper] of this.renderer.helpers) {
      engines.forEach((engine) => engine.addHelper(name, ...helper));
    }

    return this;
  }

  /** Register a preprocessor for some extensions */
  preprocess(extensions: string[] | "*", preprocessor: Processor): this {
    this.preprocessors.set(extensions, preprocessor);
    return this;
  }

  /** Register a processor for some extensions */
  process(extensions: string[] | "*", processor: Processor): this {
    this.processors.set(extensions, processor);
    return this;
  }

  /** Register a template filter */
  filter(name: string, filter: Helper, async = false): this {
    return this.helper(name, filter, { type: "filter", async });
  }

  /** Register a template helper */
  helper(name: string, fn: Helper, options: HelperOptions): this {
    this.renderer.addHelper(name, fn, options);
    return this;
  }

  /** Register extra data accessible by the layouts */
  data(name: string, data: unknown): this {
    this.globalData[name] = data;
    return this;
  }

  /** Register an extra component accesible by the layouts */
  component(context: string, component: Component): this {
    const pieces = context.split(".");
    let components = this.globalComponents;

    while (pieces.length) {
      const name = pieces.shift()!;
      if (!components.get(name)) {
        components.set(name, new Map());
      }
      components = components.get(name) as Components;
    }

    components.set(component.name, component);
    return this;
  }

  /** Copy static files or directories without processing */
  copy(from: string, to?: string | ((path: string) => string)): this;
  copy(from: string[], to?: (path: string) => string): this;
  copy(
    from: string | string[],
    to?: string | ((path: string) => string),
  ): this {
    // File extensions
    if (Array.isArray(from)) {
      if (typeof to === "string") {
        throw new Exception(
          "copy() files by extension expects a function as second argument",
          { to },
        );
      }

      from.forEach((ext) => {
        this.formats.set({ ext, copy: to ? to : true });
      });
      return this;
    }

    this.source.addStaticPath(from, to);
    return this;
  }

  /** Ignore one or several files or directories */
  ignore(...paths: (string | ScopeFilter)[]): this {
    paths.forEach((path) => {
      if (typeof path === "string") {
        this.source.addIgnoredPath(path);
      } else {
        this.source.addIgnoreFilter(path);
      }
    });
    return this;
  }

  /** Define independent scopes to optimize the update process */
  scopedUpdates(...scopes: ScopeFilter[]): this {
    scopes.forEach((scope) => this.scopes.scopes.add(scope));
    return this;
  }

  /** Define a remote fallback for a missing local file */
  remoteFile(filename: string, url: string): this {
    this.reader.remoteFile(filename, url);
    return this;
  }

  /** Save into the cache the content of a file */
  cacheFile(filename: string, data: Data): this {
    this.reader.saveCache(filename, data);
    return this;
  }

  /** Clear the dest directory and any cache */
  async clear(): Promise<void> {
    this.reader.clearCache();
    await this.writer.clear();
  }

  /** Build the entire site */
  async build(): Promise<void> {
    if (await this.dispatchEvent({ type: "beforeBuild" }) === false) {
      return;
    }

    await this.clear();

    // Load source files
    await this.source.load();

    // Get the site content
    const [_pages, _staticFiles] = this.source.getContent(
      this.globalData,
      this.globalComponents,
      [
        (page) => !page.data.draft || this.options.dev,
      ],
    );

    // Save static files into site.files
    this.files.splice(0, this.files.length, ..._staticFiles);

    // Stop if the build is cancelled
    if (await this.#buildPages(_pages) === false) {
      return;
    }

    // Save the pages and copy static files in the dest folder
    const pages = await this.writer.savePages(this.pages);
    const staticFiles = await this.writer.copyFiles(this.files);
    this.logger.log();

    await this.dispatchEvent({ type: "afterBuild", pages, staticFiles });
  }

  /** Reload some files that might be changed */
  async update(files: Set<string>): Promise<void> {
    if (await this.dispatchEvent({ type: "beforeUpdate", files }) === false) {
      return;
    }

    // Reload the changed files
    for (const file of files) {
      // Delete the file from the cache
      this.reader.deleteCache(file);
      this.formats.deleteCache(file);

      await this.source.update(file);
    }

    // Get the site content
    const [_pages, _staticFiles] = this.source.getContent(
      this.globalData,
      this.globalComponents,
      [
        (page) => !page.data.draft || this.options.dev,
        this.scopes.getFilter(files),
      ],
    );

    // Build the pages and save static files into site.files
    this.files.splice(0, this.files.length, ..._staticFiles);

    if (await this.#buildPages(_pages) === false) {
      return;
    }

    // Save the pages and copy static files in the dest folder
    const pages = await this.writer.savePages(this.pages);
    const staticFiles = await this.writer.copyFiles(this.files);

    if (pages.length || staticFiles.length) {
      this.logger.log();
    }

    await this.dispatchEvent({
      type: "afterUpdate",
      files,
      pages,
      staticFiles,
    });
  }

  /**
   * Internal function to render pages
   * The common operations of build and update
   */
  async #buildPages(pages: Page[]): Promise<boolean> {
    if (await this.dispatchEvent({ type: "beforeRender", pages }) === false) {
      return false;
    }

    // Render the pages
    this.pages.splice(0);
    this.onDemandPages.splice(0);
    await this.renderer.renderPages(pages, this.pages, this.onDemandPages);

    // Add extra code generated by the components
    for (const extra of this.source.getComponentsExtraCode()) {
      const exists = this.pages.find((page) =>
        page.data.url === extra.data.url
      );

      // If it's duplicated, merge the content
      if (exists) {
        exists.content = `${exists.content}\n${extra.content}`;
      } else {
        this.pages.push(extra);
      }
    }

    if (await this.events.dispatchEvent({ type: "afterRender" }) === false) {
      return false;
    }

    // Remove empty pages and ondemand pages
    this.pages.splice(
      0,
      this.pages.length,
      ...this.pages.filter((page) => {
        if (page.data.url === false) {
          return false;
        }

        const shouldSkip = !page.content || page.data.ondemand;
        if (shouldSkip) {
          this.logger.warn(
            `Skipped page ${page.data.url} (${
              page.data.ondemand
                ? "page is build only on demand"
                : "file content is empty"
            })`,
          );
        }
        return !shouldSkip;
      }),
    );

    // Run the processors to the pages
    await this.processors.run(this.pages);

    return await this.dispatchEvent({ type: "beforeSave" });
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

  /** Return the URL of a path */
  url(path: string, absolute = false): string {
    if (
      path.startsWith("./") || path.startsWith("../") ||
      path.startsWith("?") || path.startsWith("#") || path.startsWith("//")
    ) {
      return path;
    }

    // It's a source file
    if (path.startsWith("~/")) {
      path = decodeURI(path.slice(1));

      // It's a page
      const page = this.pages.find((page) =>
        page.src.path + page.src.ext === path
      );

      if (page) {
        path = page.data.url as string;
      } else {
        // It's a static file
        const file = this.files.find((file) => file.src === path);

        if (file?.url) {
          path = file.url;
        } else {
          throw new Error(`Source file not found: ${path}`);
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
   * Get the content of a file.
   * Resolve the path if it's needed.
   */
  async getContent(
    file: string,
    { includes = true, loader = textLoader }: ResolveOptions = {},
  ): Promise<string | Uint8Array | undefined> {
    file = normalizePath(file);

    // It's a page
    const page = this.pages.find((page) => page.data.url === file);

    if (page) {
      return page.content;
    }

    // It's a static file
    const staticFile = this.files.find((f) => f.dest === file);

    if (staticFile) {
      const content = await this.reader.read(staticFile.src, loader);
      return content.content as Uint8Array | string;
    }

    // Search in includes
    if (includes) {
      const format = this.formats.search(file);

      if (format) {
        try {
          const source = await this.includesLoader.load(file, format);

          if (source) {
            return source[1].content as string;
          }
        } catch {
          // Ignore error
        }
      }
    }

    // Read the source files directly
    try {
      const content = await this.reader.read(file, loader);
      return content.content as Uint8Array | string;
    } catch {
      // Ignore error
    }
  }
}

/** The options for the resolve function */
export interface ResolveOptions {
  /** Whether search in the includes folder or not */
  includes?: boolean;

  /** Default loader */
  loader?: Loader;
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
  prettyUrls: boolean | "no-html-extension";

  /** Set `true` to skip logs */
  quiet: boolean;

  /** The local server options */
  server: ServerOptions;

  /** The local watcher options */
  watcher: WatcherOptions;

  /** The components options */
  components: ComponentsOptions;
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
  /** Paths to ignore by the watcher */
  ignore: (string | ((path: string) => boolean))[];

  /** The interval in milliseconds to check for changes */
  debounce: number;
}

/** The options to configure the components */
export interface ComponentsOptions {
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
   * Available only in "afterBuild", "beforeRender" and "afterUpdate"
   * contains the list of pages that have been saved
   */
  pages?: Page[];

  /**
   * Available only in "afterBuild" and "afterUpdate"
   * contains the list of static files that have been copied
   */
  staticFiles?: StaticFile[];
}

/** The available event types */
export type SiteEventType =
  | "beforeBuild"
  | "afterBuild"
  | "beforeUpdate"
  | "afterUpdate"
  | "beforeRender"
  | "afterRender"
  | "beforeRenderOnDemand"
  | "beforeSave"
  | "afterStartServer";
