import type { Engine, Helper } from "./core/renderer.ts";
import type { Data as PageData, Page } from "./core/file.ts";
import type { Loader } from "./core/loaders/mod.ts";
import type { default as Site, Plugin } from "./core/site.ts";
import type { Archetype } from "./cli/create.ts";
import type { Middleware, RequestHandler } from "./core/server.ts";

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

    /** The page data */
    export interface Data extends PageData {
      // deno-lint-ignore no-explicit-any
      [index: string]: any;
    }

    /** The page helpers */
    export interface Helpers {
      [key: string]: Helper;
    }
  }
}
