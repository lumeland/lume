import type Site from "@lumeland/core/site.ts";
import type Searcher from "@lumeland/core/searcher.ts";

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

/** Extends global data interface */
declare global {
  namespace Lume {
    export interface GlobalData {
      /**
       * The searcher helper
       * @see https://lume.land/plugins/search/
       */
      search: Searcher;
    }
  }
}
