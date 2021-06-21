import Site from "./site.ts";

/** Command executed by scripts */
export type Command = string | Function | Command[];

/** Available options for a site */
export interface SiteOptions {
  cwd: string;
  src: string;
  dest: string;
  dev: boolean;
  location: string | URL;
  metrics: boolean;
  prettyUrls: boolean;
  flags: string[];
  verbose: number;
  server: {
    port: number;
    open: boolean;
    page404: string;
  };
}

/** Build event */
export interface Event {
  type: string;
}

/** A generical Lume plugin */
export type Plugin = ((options: unknown) => PluginSetup);

/** The function that install a plugin */
export type PluginSetup = (site: Site) => void;

/** A loader */
export type Loader = (path: string) => Promise<Record<string, unknown>>;

/** The .data object of a Page */
export interface Data {
  tags?: string | string[];
  url?: string | Function;
  draft?: boolean;
  renderOrder?: number;
  content?: unknown;
  layout?: string;
  templateEngine?: string | string[];
}

/** The .src object of a Page or Directory */
export interface Src {
  path: string;
  ext?: string;
  lastModified?: Date;
  created?: Date;
}

/** The .dest object of a Page */
export interface Dest {
  path: string;
  ext?: string;
  hash?: string;
}
