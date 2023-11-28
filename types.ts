import type { Helper } from "./core/renderer.ts";
import type { Data, Page } from "./core/file.ts";
import type { default as Site, Plugin } from "./core/site.ts";
import type { Archetype } from "./cli/create.ts";
import type { Middleware, RequestHandler } from "./core/server.ts";

declare global {
  namespace Lume {
    export type { Archetype, Middleware, Page, Plugin, RequestHandler, Site };

    /** The data of a page */
    // deno-lint-ignore no-explicit-any
    export interface PageData<Type extends Record<any, any> = any>
      extends Data, Type {
      /** The title of the page */
      title?: string;
    }

    /** The page helpers */
    export interface PageHelpers {
      [key: string]: Helper;
    }
  }
}
