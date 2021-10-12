import { HTMLDocument } from "./deps/dom.ts";

/** The data of a page */
export interface Data {
  /** List of tags assigned to a page or folder */
  tags?: string[];

  /** The url of a page */
  url?: string | ((page: Page) => string);

  /** If is `true`, the page will be visible only in `dev` mode */
  draft?: boolean;

  /** The date creation of the page */
  date?: Date;

  /** To configure the render order of a page */
  renderOrder?: number;

  /** The content of a page */
  content?: unknown;

  /** The layout used to render a page */
  layout?: string;

  /** To configure a different template engine(s) to render a page */
  templateEngine?: string | string[];

  [index: string]: unknown;
}

/** A generic helper to be used in template engines */
export type Helper = (...args: unknown[]) => unknown | Promise<unknown>;

/** The options for a template helper */
export interface HelperOptions {
  /** The type of the helper (tag, filter, etc) */
  type: string;

  /** Whether the helper returns an instance or not */
  async?: boolean;

  /** Whether the helper has a body or not (used for tag types) */
  body?: boolean;
}

/** The event types */
export type EventType =
  | "beforeBuild"
  | "afterBuild"
  | "beforeUpdate"
  | "afterUpdate"
  | "afterRender"
  | "beforeSave";

/** An event object */
export interface Event {
  /** The event type */
  type: EventType;

  /**
   * Available only in "beforeUpdate" and "afterUpdate"
   * contains the files that were changed
   */
  files?: Set<string>;
}

/** An event listener */
export type EventListener = (event: Event) => unknown;

/** The .src property for a Page or Directory */
export interface Src {
  /** The path to the file (without extension) */
  path: string;

  /** The extension of the file (undefined for folders) */
  ext?: string;

  /** The last modified time */
  lastModified?: Date;

  /** The creation time */
  created?: Date;
}

/** The .dest property for a Page */
export interface Dest {
  /** The path to the file (without extension) */
  path: string;

  /** The extension of the file */
  ext: string;

  /** The hash (used to detect content changes) */
  hash?: string;
}

/** The .content property for a Page */
export type Content = Uint8Array | string;

/** A command executed by a script */
export type Command = string | ((site: Site) => unknown) | Command[];

/** The options for a Command */
export type CommandOptions = Omit<Deno.RunOptions, "cmd">;

/** A function that loads and returns the file content */
export type Loader = (path: string) => Promise<Data>;

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

  /** Set true to collect metrics and measure the build performance */
  metrics: boolean;

  /** Set true to generate pretty urls (`/about-me/`) */
  prettyUrls: boolean;

  /** The list of flags to pass to the site build */
  flags: string[];

  /** Set `true` to skip logs */
  quiet: boolean;

  /** Set `true` for testing mode (output files won't be saved in `dest` folder) */
  test: boolean;

  /** The local server options */
  server: ServerOptions;
}

/** The options to configure the local server */
export interface ServerOptions {
  /** The port to listen on */
  port: number;

  /** To open the server in a browser */
  open: boolean;

  /** The file to serve on 404 error */
  page404: string;
}

/** A (pre)processor */
export type Processor = (page: Page, site: Site) => void;

/** The method that installs a plugin */
export type PluginSetup = ((options: unknown) => Plugin);

/** A generic Lume plugin */
export type Plugin = (site: Site) => void;

/** An interface used by all template engines */
export interface Engine {
  /** Render a template */
  render(
    content: unknown,
    data: Data,
    filename: string,
  ): unknown | Promise<unknown>;

  /** Add a helper to the template engine */
  addHelper(
    name: string,
    fn: Helper,
    options: HelperOptions,
  ): void;
}

/** A page */
export interface Page {
  /** The directory this page is in */
  parent?: Directory;

  /** The src info of this page */
  src: Src;

  /** The destination of the page */
  dest: Dest;

  /** Is `true` if the data assigned to this page was merged */
  dataLoaded: boolean;

  /** The associated merged data */
  data: Data;

  /** Internal data, used by plugins, processors, etc to save arbitrary values */
  _data: Record<string, unknown>;

  /** The content of this page */
  content?: Content;

  /** The parsed HTML code from the content */
  document?: HTMLDocument;

  /** Duplicate this page. Optionally, you can provide new data */
  duplicate(data?: Data): Page;

  /** Refresh the cached merged data (used for rebuild) */
  refreshCache(): void;

  /** Merge more data with the existing */
  addData(data: Data): void;
}

/** A directory */
export interface Directory {
  /** The parent directory */
  parent?: Directory;

  /** The src info of this directory */
  src: Src;

  /**
   * Is `true` if the data assigned to this directory was loaded
   * _data or _data.* files, and merged
   */
  dataLoaded: boolean;

  /** The associated merged data */
  data: Data;

  /** The list of pages included in this directory */
  pages: Map<string, Page>;

  /** The list os subdirectories */
  dirs: Map<string, Directory>;

  /** Create a subdirectory and return it */
  createDirectory(name: string): Directory;

  /** Add a page to this directory */
  setPage(name: string, page: Page): void;

  /** Remove a page from this directory */
  unsetPage(name: string): void;

  /** Return the list of pages in this directory recursively */
  getPages(): Iterable<Page>;

  /** Refresh the data cache in this directory recursively (used for rebuild) */
  refreshCache(): void;

  /** Merge more data with the existing */
  addData(data: Data): void;
}

/** A source loader */
export interface Source {
  /** The Site instance associated with this source */
  site: Site;

  /** The root of the src directory */
  root: Directory;

  /** List of extensions to load data files and the loader used */
  data: Map<string, Loader>;

  /** List of extensions to load page files and the loader used */
  pages: Map<string, Loader>;

  /** List of files and folders to copy */
  staticFiles: Map<string, string>;

  /** List of extensions that must be treated as assets (`.css`, `.js`, etc) */
  assets: Set<string>;

  /** The list of paths to ignore */
  ignored: Set<string>;

  /** Return the File or Directory of a path */
  getFileOrDirectory(path: string): Directory | Page | undefined;

  /**
   * Check whether a file is included in the list of static files
   * and return a [from, to] tuple
   */
  isStatic(file: string): [string, string] | false;

  /** Check whether a path is ignored or not */
  isIgnored(path: string): boolean;

  /** Load a directory recursively */
  loadDirectory(directory?: Directory): Promise<void>;

  /** Reload a file */
  loadFile(file: string): Promise<void>;

  /** Load a file using a loader */
  load(path: string, loader: Loader): Promise<Data>;
}

/** A script runner */
export interface Scripts {
  /** All registered scripts */
  scripts: Map<string, Command[]>;

  /** Register a new script */
  set(name: string, ...commands: Command[]): void;

  /** Run one or more scripts */
  run(options: CommandOptions, ...names: Command[]): Promise<boolean>;
}

/** A site builder */
export interface Site {
  /** The site options */
  options: SiteOptions;

  /** The source handler instance */
  source: Source;

  /** The script runner instance */
  scripts: Scripts;

  /** The metric handler instance */
  metrics: Metrics;

  /** Template engines by extension */
  engines: Map<string, Engine>;

  /** The registered helpers */
  helpers: Map<string, [Helper, HelperOptions]>;

  /** Extra data to be passed to the layouts */
  extraData: Record<string, unknown>;

  /** Event listeners */
  listeners: Map<EventType, Set<EventListener | string>>;

  /** All preprocessors */
  preprocessors: Map<Processor, string[]>;

  /** All processors */
  processors: Map<Processor, string[]>;

  /** List of pages generated by the build */
  pages: Page[];

  /** Flags passed after `--` */
  flags: string[];

  /** To store the includes paths by extension */
  includes: Map<string, string>;

  /** Return the src path */
  src(...path: string[]): string;

  /** Return the dest path */
  dest(...path: string[]): string;

  /** Add an event */
  addEventListener(type: EventType, listener: EventListener | string): this;

  /** Dispatch an event */
  dispatchEvent(event: Event): Promise<boolean>;

  /** Use a plugin */
  use(plugin: Plugin): this;

  /** Register a script */
  script(name: string, ...scripts: Command[]): this;

  /** Register a data loader for some extensions */
  loadData(extensions: string[], loader: Loader): this;

  /** Register a page loader for some extensions */
  loadPages(extensions: string[], loader?: Loader, engine?: Engine): this;

  /** Register an assets loader for some extensions */
  loadAssets(extensions: string[], loader?: Loader): this;

  /** Register a preprocessor for some extensions */
  preprocess(extensions: string[], preprocessor: Processor): this;

  /** Register a processor for some extensions */
  process(extensions: string[], processor: Processor): this;

  /** Register a template filter */
  filter(name: string, filter: Helper, async?: boolean): this;

  /** Register a template helper */
  helper(name: string, fn: Helper, options: HelperOptions): this;

  /** Register extra data accessible by layouts */
  data(name: string, data: unknown): this;

  /** Copy static files or directories without processing */
  copy(from: string, to?: string): this;

  /** Ignore one or several files or directories */
  ignore(...paths: string[]): this;

  /** Clear the dest directory */
  clear(): Promise<void>;

  /** Build the entire site */
  build(watchMode: boolean): Promise<void>;

  /** Reload some files that might be changed */
  update(files: Set<string>): Promise<void>;

  /** Run a script */
  run(name: string, options?: CommandOptions): Promise<boolean>;

  /** Return the URL of a page */
  url(path: string, absolute?: boolean): string;

  /** Return the content of a file of the site */
  getFileContent(url: string): Promise<string | Uint8Array>;
}

/** A collection of all metrics */
export interface Metrics {
  /** Start measuring */
  start(name: string, details?: MetricDetail): Metric;

  /** Print the metrics in the console */
  print(): void;

  /** Save the metrics data in a file */
  save(file: string): Promise<void>;
}

/** A single metric */
export interface Metric {
  /** The metric name */
  name: string;

  /** Additional info of the metric */
  details?: MetricDetail;

  /** Stop measuring */
  stop(): void;
}

/** The details associated to a metric */
export interface MetricDetail {
  /** Page related with this metric */
  page?: Page;

  [key: string]: unknown;
}
