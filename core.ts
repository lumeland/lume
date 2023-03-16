import type {
  DeepPartial,
  DenoConfig,
  DenoConfigResult,
  ImportMap,
} from "./core/utils.ts";
import type {
  ComponentsOptions,
  default as Site,
  ServerOptions,
  SiteEvent,
  SiteEventType,
  SiteOptions,
  WatcherOptions,
} from "./core/site.ts";

import type {
  default as Events,
  Event,
  EventListener,
  EventOptions,
} from "./core/events.ts";

import type {
  default as Scripts,
  ScriptOptions,
  ScriptOrFunction,
} from "./core/scripts.ts";

import type {
  default as Reader,
  DirEntry,
  FileInfo,
  Loader,
} from "./core/reader.ts";
import type Logger from "./core/logger.ts";
import type PagePreparer from "./core/page_preparer.ts";
import type Writer from "./core/writer.ts";
import type IncludesLoader from "./core/includes_loader.ts";
import type { default as PageLoader } from "./core/page_loader.ts";
import type DataLoader from "./core/data_loader.ts";
import type {
  Component,
  default as ComponentLoader,
} from "./core/component_loader.ts";
import type {
  Components,
  Content,
  Data,
  Dest,
  Directory,
  Page,
  Src,
  StaticFile,
} from "./core/filesystem.ts";
import type {
  ComponentFunction,
  default as Source,
  ProxyComponents,
} from "./core/source.ts";
import type {
  default as Renderer,
  Engine,
  Helper,
  HelperOptions,
} from "./core/renderer.ts";
import type {
  default as Processors,
  Extensions,
  MultiProcessor,
  Processor,
} from "./core/processors.ts";
import type { default as Scopes, ScopeFilter } from "./core/scopes.ts";
import type { ErrorData, Exception } from "./core/errors.ts";
import type { default as Formats, Format } from "./core/formats.ts";
import type {
  default as Server,
  Middleware,
  RequestHandler,
  ServerEvent,
  ServerEventType,
} from "./core/server.ts";
import type {
  default as Watcher,
  WatchEvent,
  WatchEventType,
} from "./core/watcher.ts";

// Plugins types
import type { PaginationInfo, Paginator } from "./plugins/paginate.ts";
import type { Transformation } from "./plugins/imagick.ts";
import type { MetaData } from "./plugins/metas.ts";
import type { Search } from "./plugins/search.ts";
import type { Children } from "./plugins/jsx.ts";
import type { SourceMap } from "./plugins/source_maps.ts";

/** The method that installs a plugin */
type PluginSetup = (options: unknown) => Plugin;

/** A generic Lume plugin */
type Plugin = (site: Site) => void;

export type {
  Component,
  ComponentFunction,
  ComponentLoader,
  Components,
  ComponentsOptions,
  Content,
  Data,
  DataLoader,
  DeepPartial,
  DenoConfig,
  DenoConfigResult,
  Dest,
  Directory,
  DirEntry,
  Engine,
  ErrorData,
  Event,
  EventListener,
  EventOptions,
  Events,
  Exception,
  Extensions,
  FileInfo,
  Format,
  Formats,
  Helper,
  HelperOptions,
  ImportMap,
  IncludesLoader,
  Loader,
  Logger,
  Middleware,
  MultiProcessor,
  Page,
  PageLoader,
  PagePreparer,
  Plugin,
  PluginSetup,
  Processor,
  Processors,
  ProxyComponents,
  Reader,
  Renderer,
  RequestHandler,
  ScopeFilter,
  Scopes,
  ScriptOptions,
  ScriptOrFunction,
  Scripts,
  Server,
  ServerEvent,
  ServerEventType,
  ServerOptions,
  Site,
  SiteEvent,
  SiteEventType,
  SiteOptions,
  Source,
  SourceMap,
  Src,
  StaticFile,
  Watcher,
  WatcherOptions,
  WatchEvent,
  WatchEventType,
  Writer,
};

export interface PageData extends Data {
  /** The language(s) of the page */
  lang?: string | string[];

  /** The title of the page */
  title?: string;

  /** The page url */
  url: string | false;

  /** The page reference */
  page: Page;

  /**
   * The available components
   * @see https://lume.land/docs/core/components/
   */
  // deno-lint-ignore no-explicit-any
  comp?: any;

  /**
   * The paginator helper
   * @see https://lume.land/plugins/paginate/
   */
  paginate: Paginator;

  /**
   * The pagination info
   * @see https://lume.land/plugins/paginate/
   */
  pagination?: PaginationInfo;

  /**
   * The pagination result
   * @see https://lume.land/plugins/paginate/
   */
  results?: Page[];

  /**
   * Image transformations
   * @see https://lume.land/plugins/imagick/
   */
  imagick?: Transformation | Transformation[];

  /**
   * Meta elements
   * @see https://lume.land/plugins/metas/
   */
  metas?: MetaData;

  /**
   * Netlify CMS configuration
   * @see https://lume.land/plugins/netlify_cms/
   */
  netlify_cms?: Record<string, unknown>;

  /**
   * The searcher helper
   * @see https://lume.land/plugins/search/
   */
  search: Search;

  /**
   * The source map data (if it's an asset)
   */
  sourceMap?: SourceMap;

  /**
   * The mergeLanguages helper
   */
  mergeLanguages: (
    pages: Record<string, Record<string, unknown>[]>,
  ) => unknown[];

  /**
   * Alternate pages (for languages)
   */
  alternates: Record<string, PageData>;

  /**
   * The JSX children elements
   * @see https://lume.land/plugins/jsx/
   */
  children?: Children;
}

export interface PageHelpers {
  /** @see https://lume.land/plugins/attributes/ */
  attr: Helper;

  /** @see https://lume.land/plugins/attributes/ */
  class: Helper;

  /** @see https://lume.land/plugins/date/ */
  date: Helper;

  /** @see https://lume.land/plugins/liquid/ */
  liquid: Helper;

  /** @see https://lume.land/plugins/markdown/ */
  md: Helper;

  /** @see https://lume.land/plugins/nunjucks/ */
  njk: Helper;

  /** @see https://lume.land/plugins/postcss/ */
  postcss: Helper;

  /** @see https://lume.land/plugins/pug/ */
  pug: Helper;

  /** @see https://lume.land/plugins/slugify_urls/ */
  slugify: Helper;

  /** @see https://lume.land/plugins/terser/#the-terser-filter */
  terser: Helper;

  /** @see https://lume.land/plugins/url/#url-filter */
  url: Helper;

  /** @see https://lume.land/plugins/url/#htmlurl-filter */
  htmlUrl: Helper;

  [key: string]: Helper | undefined;
}

/** Definition used to create a new Page */
export interface Archetype {
  path: string;
  content: string | Record<string, unknown> | Uint8Array;
}
