import Site from "./core/site.ts";

import {
  Event,
  EventListener,
  EventOptions,
  Events,
  EventType,
} from "./core/events.ts";

import { ScriptOptions, ScriptOrFunction, Scripts } from "./core/scripts.ts";

import { Reader } from "./core/reader.ts";
import { Logger } from "./core/logger.ts";
import { Writer } from "./core/writer.ts";
import { Directory, Page } from "./core/filesystem.ts";
import Source from "./core/source.ts";

export type {
  Directory,
  Event,
  EventListener,
  EventOptions,
  Events,
  EventType,
  Logger,
  Page,
  Reader,
  ScriptOptions,
  ScriptOrFunction,
  Scripts,
  Site,
  Source,
  Writer,
};

export interface ErrorData {
  cause?: Error;
  name?: string;
  [key: string]: unknown;
}

export type ScopeFilter = (path: string) => boolean;

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
}

/** The options to configure the local server */
export interface ServerOptions {
  /** The port to listen on */
  port: number;

  /** To open the server in a browser */
  open: boolean;

  /** The file to serve on 404 error */
  page404: string;

  /** Optional request handler for pages served on demand */
  router?: (url: URL) => Promise<FileResponse | undefined>;
}

/** Data to create a new response. */
export type FileResponse = [BodyInit | null, ResponseInit];

/** The options to configure the local watcher */
export interface WatcherOptions {
  /** Files or folders to ignore by the watcher */
  ignore: string[];

  /** The interval in milliseconds to check for changes */
  debounce: number;
}

/**
 * Class to manage the template engines, processors
 * and render the pages
 */
export interface Renderer {
  /** Extra data to be passed to the layouts */
  extraData: Record<string, unknown>;

  /** Register a template engine for some extensions */
  addEngine(extensions: string[], engine: Engine): void;

  /** Register a preprocessor for some extensions */
  addPreprocessor(extensions: string[], preprocessor: Processor): void;

  /** Register a processor for some extensions */
  addProcessor(extensions: string[], processor: Processor): void;

  /** Configure a includes folder for some extensions */
  addInclude(extensions: string[], path: string): void;

  /** Register a template helper */
  addHelper(name: string, fn: Helper, options: HelperOptions): void;

  /** Render the pages */
  renderPages(from: Iterable<Page>, to: Page[]): Promise<void>;

  /** Render a page on demand */
  renderPageOnDemand(page: Page): Promise<void>;

  /** Render a template */
  render(
    engine: Engine,
    content: unknown,
    data?: Data,
    filename?: string,
  ): unknown | Promise<unknown>;

  /** Render a template synchronous */
  renderSync(
    engine: Engine,
    content: unknown,
    data?: Data,
    filename?: string,
  ): string;
}

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

  /** Whether render this page on demand or not */
  ondemand?: boolean;

  [index: string]: unknown;
}

/** A function that loads and returns the file content */
export type Loader = (path: string) => Promise<Data>;

/** A (pre)processor */
export type Processor = (page: Page) => void;

/** The method that installs a plugin */
export type PluginSetup = ((options: unknown) => Plugin);

/** A generic Lume plugin */
export type Plugin = (site: Site) => void;
