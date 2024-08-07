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

/**
 * A plugin to add a search helper to the data
 * Installed by default
 * @see https://lume.land/plugins/search/
 */
export function search(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.data(options.name, site.search);
  };
}

export default search

/** Extends Data interface */
declare global {
  namespace Lume {
    export interface Data {
      /**
       * The searcher helper
       * @see https://lume.land/plugins/search/
       */
      search: Searcher;
    }
  }
}
