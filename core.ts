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

import type { default as Reader, Loader } from "./core/reader.ts";
import type Logger from "./core/logger.ts";
import type Writer from "./core/writer.ts";
import type IncludesLoader from "./core/includes_loader.ts";
import type { default as PageLoader } from "./core/page_loader.ts";
import type DataLoader from "./core/data_loader.ts";
import type {
  Component,
  ComponentsTree,
  default as ComponentLoader,
} from "./core/component_loader.ts";
import type { ComponentFunction, ProxyComponents } from "./core/components.ts";
import type {
  Content,
  Data,
  Dest,
  Directory,
  Page,
  Src,
  StaticFile,
} from "./core/filesystem.ts";
import type Source from "./core/source.ts";
import type Renderer from "./core/renderer.ts";
import type { default as Processors, Processor } from "./core/processors.ts";
import type { default as Scopes, ScopeFilter } from "./core/scopes.ts";
import type {
  default as Engines,
  Engine,
  Helper,
  HelperOptions,
} from "./core/engines.ts";
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

/** The method that installs a plugin */
type PluginSetup = ((options: unknown) => Plugin);

/** A generic Lume plugin */
type Plugin = (site: Site) => void;

export type {
  Component,
  ComponentFunction,
  ComponentLoader,
  ComponentsOptions,
  ComponentsTree,
  Content,
  Data,
  DataLoader,
  Dest,
  Directory,
  Engine,
  Engines,
  ErrorData,
  Event,
  EventListener,
  EventOptions,
  Events,
  Exception,
  Format,
  Formats,
  Helper,
  HelperOptions,
  IncludesLoader,
  Loader,
  Logger,
  Middleware,
  Page,
  PageLoader,
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
  Src,
  StaticFile,
  Watcher,
  WatcherOptions,
  WatchEvent,
  WatchEventType,
  Writer,
};
