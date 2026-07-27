import type { Engine, Helper } from "./core/renderer.ts";
import type { Page } from "./core/file.ts";
import type { Loader } from "./core/fs.ts";
import type { default as Site, Plugin } from "./core/site.ts";
import type { Archetype, ArchetypeFile } from "./core/archetypes.ts";
import type { Middleware, RequestHandler } from "./core/server.ts";
import type { MergeStrategy } from "./core/utils/merge_data.ts";
import type { ProxyComponents } from "./core/components.ts";

/** Raw data defined for pages or _data files */
export type RawData<D = unknown> = D & {
  /** List of tags assigned to a page or folder */
  tags?: string | string[];

  /** The url of a page */
  url?: string | false | ((page: Page<D>) => string | false);

  /** The basename of a page */
  basename?: string;

  /** Mark the page as a draft */
  draft?: boolean;

  /** The date creation of the page */
  date?: Date | string | number;

  /** To configure the rendering order of a page */
  renderOrder?: number;

  /** The raw content of a page */
  content?: unknown;

  /** The layout used to render a page */
  layout?: string;

  /** To configure a different template engine(s) to render a page */
  templateEngine?: string | string[];

  /** To configure how some data keys will be merged with the parent */
  mergedKeys?: Record<string, MergeStrategy>;

  [index: string]: DefaultType;
};

/** Data defined in _data files */
export type DirectoryData<D = unknown> = RawData<D> & {
  basename: string;
  comp: ProxyComponents;
};

/** Data available for static files */
export type FileData<D = unknown> = DirectoryData<D> & {
  url: string;
};

/** Data available for pages */
type PageData<D = unknown> = FileData<D> & {
  page: Page<D>;
  date: Date;
};

export type { PageData as Data };

// deno-lint-ignore no-explicit-any
export type DefaultType = Lume.TypeConfig["strict"] extends true ? unknown
  : any;

declare global {
  namespace Lume {
    export type {
      Archetype,
      ArchetypeFile,
      Engine,
      Loader,
      Middleware,
      Page,
      Plugin,
      RequestHandler,
      Site,
    };

    export interface TypeConfig {
      [index: string]: unknown;
    }

    /** Global data extended by plugins */
    export interface GlobalData {
      // deno-lint-ignore no-explicit-any
      [index: string]: TypeConfig["strict"] extends true ? unknown : any;
    }

    /** The page data */
    export type Data<D = unknown> = PageData<D> & GlobalData;

    /** The page helpers */
    export interface Helpers {
      [key: string]: Helper;
    }
  }
}
