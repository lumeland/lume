import Site from "./site.js";
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
  files?: string[];
}

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
