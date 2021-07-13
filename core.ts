import { HTMLDocument } from "./deps/dom.ts";

/** The data of a page */
export interface Data {
  tags?: string[];
  url?: string | ((page: Page) => string);
  draft?: boolean;
  renderOrder?: number;
  content?: unknown;
  layout?: string;
  templateEngine?: string | string[];
  [index: string]: unknown;
}

/** A generic helper to be used in template engines */
export type Helper = (...args: unknown[]) => string | Promise<string>;

/** The options for a template helper */
export interface HelperOptions {
  type: string;
  async?: boolean;
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
  type: EventType;
  files?: Set<string>;
}

/** An event listener */
export type EventListener = (event: Event) => unknown;

/** The .src property for a Page or Directory */
export interface Src {
  path: string;
  ext?: string;
  lastModified?: Date;
  created?: Date;
}

/** The .dest property for a Page */
export interface Dest {
  path: string;
  ext: string;
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

/** The options for the paginate helper */
export interface PaginateOptions {
  size: number;
  url: (page: number) => string;
}

/** The paginate result */
export interface PaginateResult {
  url: string;
  results: unknown[];
  pagination: {
    page: number;
    totalPages: number;
    totalResults: number;
    previous: string | null;
    next: string | null;
  };
}

/** The options to configure the site build */
export interface SiteOptions {
  cwd: string;
  src: string;
  dest: string;
  includes: string;
  dev: boolean;
  location: URL;
  metrics: boolean;
  prettyUrls: boolean;
  flags: string[];
  quiet: boolean;
  server: ServerOptions;
}

/** The options to configure the local server */
export interface ServerOptions {
  port: number;
  open: boolean;
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
  parent?: Directory;
  src: Src;
  dest: Dest;

  /** The associated merged data */
  data: Data;

  /** The content of this page */
  content?: Content;

  /** The parsed HTML code from the content */
  document?: HTMLDocument;

  /** Duplicate this page. Optionally, you can provide new data */
  duplicate(data?: Data): Page;

  /** Refresh the cached merged data (used for rebuild) */
  refreshCache(): void;
}

/** A directory */
export interface Directory {
  parent?: Directory;
  src: Src;
  data: Data;
  pages: Map<string, Page>;
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
}

/** A source loader */
export interface Source {
  site: Site;
  root: Directory;
  data: Map<string, Loader>;
  pages: Map<string, Loader>;
  staticFiles: Map<string, string>;
  assets: Set<string>;
  ignored: Set<string>;

  /**
   * Return the Directory instance of a path
   * and create if it doesn't exist
   */
  getOrCreateDirectory(path: string): Directory;

  /** Return the File or Directory of a path */
  getFileOrDirectory(path: string): Directory | Page | undefined;

  /**
   * Check whether a file is included in the static files
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
  /** Register a new script */
  set(name: string, ...commands: Command[]): void;

  /** Run one or more scripts */
  run(options: CommandOptions, ...names: Command[]): Promise<boolean>;
}

/** A site builder */
export interface Site {
  options: SiteOptions;
  source: Source;
  scripts: Scripts;
  metrics: Metrics;
  engines: Map<string, Engine>;
  helpers: Map<string, [Helper, HelperOptions]>;
  extraData: Record<string, unknown>;
  listeners: Map<EventType, Set<EventListener | string>>;
  preprocessors: Map<string, Processor[]>;
  processors: Map<string, Processor[]>;
  pages: Page[];
  flags: string[];

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
  name: string;
  details?: MetricDetail;
  stop(): void;
}

/** The details associated to a metric */
export interface MetricDetail {
  page?: Page;
  [key: string]: unknown;
}
