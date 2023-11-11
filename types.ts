import type { Helper } from "./core/renderer.ts";
import type { Data, Page } from "./core/file.ts";

declare global {
  namespace Lume {
    /** The data of a page */
    export interface PageData extends Data {
      /** The language(s) of the page */
      lang?: string;

      /** The title of the page */
      title?: string;

      /** The page url */
      url: string;

      /** The page reference */
      page: Page;

      /**
       * The available components
       * @see https://lume.land/docs/core/components/
       */
      // deno-lint-ignore no-explicit-any
      comp?: any;
    }

    /** The page helpers */
    export interface PageHelpers {
      [key: string]: Helper;
    }
  }
}
