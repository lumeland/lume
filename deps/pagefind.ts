export * as pagefind from "npm:pagefind@1.1.0";
export type { CustomRecord } from "npm:pagefind@1.1.0";

export interface TranslationsOptions {
  /** English default: "Search" */
  placeholder?: string;
  /** English default: "Clear" */
  clear_search?: string;
  /** English default: "Load more results" */
  load_more?: string;
  /** English default: "Search this site" */
  search_label?: string;
  /** English default: "Filters" */
  filters_label?: string;
  /** English default: "No results for [SEARCH_TERM]" */
  zero_results?: string;
  /** English default: "[COUNT] results for [SEARCH_TERM]" */
  many_results?: string;
  /** English default: "[COUNT] result for [SEARCH_TERM]" */
  one_result?: string;
  /** English default: "No results for [SEARCH_TERM]. Showing results for [DIFFERENT_TERM] instead" */
  alt_search?: string;
  /** English default: "No results for [SEARCH_TERM]. Try one of the following searches:" */
  search_suggestion?: string;
  /** English default: "Searching for [SEARCH_TERM]..." */
  searching?: string;
}
