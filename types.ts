import type { Helper } from "./core/renderer.ts";
import type { Data, Page } from "./core/file.ts";
import type Site from "./core/site.ts";
import type { Archetype } from "./cli/create.ts";

declare global {
  namespace Lume {
    export type { Archetype, Page, Site };

    /** The data of a page */
    // deno-lint-ignore no-explicit-any
    export interface PageData<Type extends Record<any, any> = any>
      extends Data, Type {
      /** The language(s) of the page */
      lang?: string;

      /** The title of the page */
      title?: string;
    }

    /** The page helpers */
    export interface PageHelpers {
      [key: string]: Helper;
    }
  }
}
