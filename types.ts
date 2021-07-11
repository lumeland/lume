import Site from "./site.ts";
import { Page } from "./filesystem.ts";

/**
 * The data of a page
 */
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

/**
 * Generical helper to use in the template engines
 */
export type Helper = (...args: unknown[]) => string | Promise<string>;

/**
 * The available options for template helpers
 */
export interface HelperOptions {
  type: string;
  async?: boolean;
  body?: boolean;
}

/**
 * All available event types
 */
export type EventType =
  | "beforeBuild"
  | "afterBuild"
  | "beforeUpdate"
  | "afterUpdate"
  | "afterRender"
  | "beforeSave";

/**
 * An event object
 */
export interface Event {
  type: EventType;
  files?: Set<string>;
}

/**
 * A listener for events
 */
export type EventListener = (event: Event) => unknown;

/**
 * The .src property for a Page or Directory
 */
export interface Src {
  path: string;
  ext?: string;
  lastModified?: Date;
  created?: Date;
}

/**
 * The .dest property for a Page
 */
export interface Dest {
  path: string;
  ext: string;
  hash?: string;
}

/**
 * The .content property for a Page
 */
export type Content = Uint8Array | string;

/**
 * Command executed by scripts
 */
export type Command = string | ((site: Site) => unknown) | Command[];

/**
 * Options available for Commands
 */
export type CommandOptions = Omit<Deno.RunOptions, "cmd">;

/**
 * A loader is a function that load and return a file content
 */
export type Loader = (path: string) => Promise<Data>;

/**
 * The available options for the paginate helper
 */
export interface PaginateOptions {
  size: number;
  url: (page: number) => string;
}

/**
 * The paginate result
 */
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

/**
 * Available options to configure the site build
 */
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

/**
 * The options to configure the local server
 */
export interface ServerOptions {
  port: number;
  open: boolean;
  page404: string;
}

/**
 * A (pre)processor
 */
export type Processor = (page: Page, site: Site) => void;

/**
 * The function that install a plugin
 */
export type PluginSetup = ((options: unknown) => Plugin);

/**
 * A generical Lume plugin
 */
export type Plugin = (site: Site) => void;

/**
 * Interface used by all template engines
 */
export interface Engine {
  /**
   * Renders a template
   *
   * @param content The template content
   * @param data The data used to render the template
   * @param filename The filename of the template
   */
  render(
    content: unknown,
    data: Data,
    filename: string,
  ): unknown | Promise<unknown>;

  /**
   * Adds a helper to the template engine
   *
   * @param name The helper name
   * @param fn The function assigned
   * @param options Options to configure the helper
   */
  addHelper(
    name: string,
    fn: Helper,
    options: HelperOptions,
  ): void;
}
