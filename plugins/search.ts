import type Site from "../core/site.ts";
import type Searcher from "../core/searcher.ts";

/**
 * A plugin to add a search helper to the data
 * Installed by default
 * @see https://lume.land/plugins/search/
 */
export function search() {
  return (site: Site) => {
    site.data("search", site.search);
  };
}

export default search;

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
