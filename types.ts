import Site from "./site.ts";
import { Page } from "./filesystem.ts";

/** Command executed by scripts */
export type Command = string | ((site: Site) => unknown) | Command[];

/** Options available for the Command. */
export interface CommandOptions {
  cwd?: string;
  env?: Record<string, string>;
  stdout?: "inherit" | "piped" | "null" | number;
  stderr?: "inherit" | "piped" | "null" | number;
  stdin?: "inherit" | "piped" | "null" | number;
}

/** A (pre)processor */
export type Processor = (page: Page, site: Site) => void;

/** Available options for a site */
export interface SiteOptions {
  cwd: string;
  src: string;
  dest: string;
  dev: boolean;
  location: URL;
  metrics: boolean;
  prettyUrls: boolean;
  flags: string[];
  verbose: 1 | 2 | 3;
  server: ServerOptions;
}

export interface ServerOptions {
  port: number;
  open: boolean;
  page404: string;
}

/** A generic event */
export type EventType =
  | "beforeBuild"
  | "afterBuild"
  | "beforeUpdate"
  | "afterUpdate"
  | "afterRender"
  | "beforeSave";
export interface Event {
  type: EventType;
  files?: string[];
}

/** A listener for events */
export type EventListener = (event: Event) => unknown;

/** A generical Lume plugin */
export type Plugin = ((options: unknown) => PluginSetup);

/** The function that install a plugin */
export type PluginSetup = (site: Site) => void;

/** A loader */
export type Loader = (path: string) => Promise<Data>;

/** The data object of a page or _data file */
export interface Data {
  tags?: string | string[];
  url?: string | ((page: Page) => string);
  draft?: boolean;
  renderOrder?: number;
  content?: unknown;
  layout?: string;
  templateEngine?: string | string[];
  [index: string]: unknown;
}

/** The merged data object of a page or directory */
export interface MergedData extends Data {
  tags: string[];
}

/** The .src object of a Page or Directory */
export interface Src {
  path: string;
  ext?: string;
  lastModified?: Date | null;
  created?: Date | null;
}

/** The .dest object of a Page */
export interface Dest {
  path: string;
  ext: string;
  hash?: string;
}

/** Generical helper to use in the template engines */
export type Helper = (...args: unknown[]) => unknown;

/** The available options for template helpers */
export interface HelperOptions {
  type: string;
  async?: boolean;
  body?: boolean;
}

/** The available options for paginate */
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
