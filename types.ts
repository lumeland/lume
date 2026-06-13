import type { Engine, Helper } from "./core/renderer.ts";
import type { Data as PageData, Page } from "./core/file.ts";
import type { Loader } from "./core/fs.ts";
import type { default as Site, Plugin } from "./core/site.ts";
import type { Archetype } from "./cli/create.ts";
import type { Middleware, RequestHandler } from "./core/server.ts";
import type { ProxyComponents as ProxyComponents_ } from "./core/components.ts";
import { SearchPluginData } from "./plugins/search.ts";
import { PaginatePluginData } from "./plugins/paginate.ts";

declare global {
  namespace Lume {
    export type {
      Archetype,
      Engine,
      Loader,
      Middleware,
      Page,
      Plugin,
      RequestHandler,
      Site,
    };

    export interface ProxyComponents extends ProxyComponents_ {}

    /** The page data */
    export interface Data
      extends PageData, PaginatePluginData, SearchPluginData<Data> {
      // deno-lint-ignore no-explicit-any
      [index: string]: Data["__strict"] extends true ? unknown : any;

      comp: ProxyComponents;
    }

    /** The page helpers */
    export interface Helpers {
      [key: string]: Helper;
    }
  }
}
