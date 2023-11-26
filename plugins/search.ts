import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";
import type Searcher from "../core/searcher.ts";

export interface Options {
  /** The helper name */
  name?: string;
}

export const defaults: Options = {
  name: "search",
};

/** Register the plugin to enable the `search` helpers */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.data(options.name, site.search);
  };
}

/** Extends PageData interface */
declare global {
  namespace Lume {
    export interface PageData {
      /**
       * The searcher helper
       * @see https://lume.land/plugins/search/
       */
      search: Searcher;
    }
  }
}
