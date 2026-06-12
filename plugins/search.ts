import type Site from "../core/site.ts";
import type Searcher from "../core/searcher.ts";
import type { Data } from "../core/file.ts";

export interface SearchPluginData extends Data {
  /**
   * The searcher helper
   * @see https://lume.land/plugins/search/
   */
  search: Searcher<Lume.Data>;
}

/**
 * A plugin to add a search helper to the data
 * Installed by default
 * @see https://lume.land/plugins/search/
 */
export function search() {
  return (site: Site<SearchPluginData>) => {
    site.data("search", site.search);
  };
}

export default search;
