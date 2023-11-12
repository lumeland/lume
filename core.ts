import type {
  ComponentsOptions,
  default as Site,
  Plugin,
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

import type { Archetype } from "./cli/create.ts";
import type { default as Scripts, ScriptOrFunction } from "./core/scripts.ts";

import type { default as FS, Entry, Loader } from "./core/fs.ts";
import type Searcher from "./core/searcher.ts";
import type Writer from "./core/writer.ts";
import type DataLoader from "./core/data_loader.ts";
import type {
  Component,
  Components,
  default as ComponentLoader,
} from "./core/component_loader.ts";
import type {
  Content,
  Data,
  MergeStrategy,
  Page,
  Src,
  StaticFile,
} from "./core/file.ts";
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
type PluginSetup = (options: unknown) => Plugin;

export type {
  Archetype,
  Component,
  ComponentFunction,
  ComponentLoader,
  Components,
  ComponentsOptions,
  Content,
  Data,
  DataLoader,
  Engine,
  Entry,
  Event,
  EventListener,
  EventOptions,
  Events,
  Extensions,
  Format,
  Formats,
  FS,
  Helper,
  HelperOptions,
  Loader,
  MergeStrategy,
  Middleware,
  MultiProcessor,
  Page,
  Plugin,
  PluginSetup,
  Processor,
  Processors,
  ProxyComponents,
  Renderer,
  RequestHandler,
  ScopeFilter,
  Scopes,
  ScriptOrFunction,
  Scripts,
  Searcher,
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
