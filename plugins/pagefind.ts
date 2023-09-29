import { merge } from "../core/utils.ts";
import { posix } from "../deps/path.ts";
import { Page } from "../core/filesystem.ts";
import * as pagefind from "../deps/pagefind.ts";

import type { CustomRecord } from "../deps/pagefind.ts";
import type { DeepPartial, Site } from "../core.ts";

export interface TranslationsOptions {
  /** English default: "Search" */
  placeholder: string;
  /** English default: "Clear" */
  clear_search: string;
  /** English default: "Load more results" */
  load_more: string;
  /** English default: "Search this site" */
  search_label: string;
  /** English default: "Filters" */
  filters_label: string;
  /** English default: "No results for [SEARCH_TERM]" */
  zero_results: string;
  /** English default: "[COUNT] results for [SEARCH_TERM]" */
  many_results: string;
  /** English default: "[COUNT] result for [SEARCH_TERM]" */
  one_result: string;
  /** English default: "No results for [SEARCH_TERM]. Showing results for [DIFFERENT_TERM] instead" */
  alt_search: string;
  /** English default: "No results for [SEARCH_TERM]. Try one of the following searches:" */
  search_suggestion: string;
  /** English default: "Searching for [SEARCH_TERM]..." */
  searching: string;
}
export interface UIOptions {
  /** The container id to insert the search */
  containerId: string;

  /** Whether to show an image alongside each search result. */
  showImages: boolean;

  /**
   * By default, Pagefind UI shows filters with no results alongside the count (0).
   * Pass false to hide filters that have no remaining results.
   */
  showEmptyFilters: boolean;

  /**
   * By default, Pagefind UI applies a CSS reset to itself.
   * Pass false to omit this and inherit from your site styles.
   */
  resetStyles: boolean;

  /**
   * Include results from page subsections (based on headings with IDs).
   */
  showSubResults: boolean;

  /**
   * The maximum number of characters to show in the excerpt.
   * `0` means no limit
   */
  excerptLength?: number;

  /**
   * A set of custom ui strings to use instead of the automatically detected language strings.
   * See https://github.com/CloudCannon/pagefind/blob/main/pagefind_ui/translations/en.json for all available keys and initial values.
   * The items in square brackets such as SEARCH_TERM will be substituted dynamically when the text is used.
   */
  translations?: TranslationsOptions;

  /**
   * A function that Pagefind UI calls before displaying each result.
   * This can be used to fix relative URLs, rewrite titles,
   * or any other modifications you might like to make to the raw result object
   * returned by Pagefind
   */
  processResult?: (result: unknown) => unknown;

  /**
   * A function that Pagefind UI calls before performing a search.
   * This can be used to normalize search terms to match your content.
   */
  processTerm?: (term: string) => string;

  /**
   * The number of milliseconds to wait after a user stops typing before performing a search.
   * If you wish to disable this, set to 0.
   * @default 300
   */
  debounceTimeoutMs?: number;
}

export interface Options {
  /** The path to the pagefind bundle directory */
  outputPath: string;

  /** Options for the UI interface or false to disable it */
  ui: UIOptions | false;

  /** Options for the indexing process */
  indexing: pagefind.PagefindServiceConfig;

  /** Other custom records */
  customRecords?: CustomRecord[];
}

export const defaults: Options = {
  outputPath: "/pagefind",
  ui: {
    containerId: "search",
    showImages: false,
    excerptLength: 0,
    showEmptyFilters: true,
    showSubResults: false,
    resetStyles: true,
  },
  indexing: {
    rootSelector: "html",
    verbose: false,
    excludeSelectors: [],
  },
};

/** A plugin to generate a static full text search engine */
export default function (userOptions?: DeepPartial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.processAll([".html"], async (pages, allPages) => {
      const { index } = await pagefind.createIndex(options.indexing);

      if (!index) {
        throw new Error("Pagefind index not created");
      }

      // Page indexing
      for (const page of pages) {
        const { errors } = await index.addHTMLFile({
          url: site.url(page.outputPath as string),
          content: page.content as string,
        });

        if (errors.length > 0) {
          throw new Error(
            `Pagefind index errors for ${page.src.path}:\n${errors.join("\n")}`,
          );
        }
      }

      if (options.customRecords) {
        for (const record of options.customRecords) {
          const { errors } = await index.addCustomRecord(record);

          if (errors.length > 0) {
            throw new Error(
              `Pagefind index errors for custom record:\n${errors.join("\n")}`,
            );
          }
        }
      }

      // Output indexing
      const { files } = await index.getFiles();
      const textDecoder = new TextDecoder();
      const textExtensions = [".js", ".css", ".json"];

      for (const file of files) {
        const { path } = file;
        const content = textExtensions.includes(posix.extname(path))
          ? textDecoder.decode(file.content)
          : file.content;

        allPages.push(
          Page.create(posix.join("/", options.outputPath, path), content),
        );
      }

      // Cleanup
      await index.deleteIndex();
      await pagefind.close();
    });

    if (options.ui) {
      const { containerId, ...ui } = options.ui;

      site.process([".html"], (page) => {
        const { document } = page;
        if (!document) {
          return;
        }
        const container = document.getElementById(containerId);

        // Insert UI styles and scripts
        if (container) {
          const styles = document.createElement("link");
          styles.setAttribute("rel", "stylesheet");
          styles.setAttribute(
            "href",
            site.url(
              `${posix.join(options.outputPath, "pagefind-ui.css")}`,
            ),
          );

          // Insert before other styles to allow overriding
          const first = document.head.querySelector(
            "link[rel=stylesheet],style",
          );
          if (first) {
            document.head.insertBefore(styles, first);
          } else {
            document.head.append(styles);
          }

          const script = document.createElement("script");
          script.setAttribute("type", "text/javascript");
          script.setAttribute(
            "src",
            site.url(
              `${posix.join(options.outputPath, "pagefind-ui.js")}`,
            ),
          );

          const uiSettings = {
            element: `#${containerId}`,
            ...ui,
            bundlePath: site.url(posix.join(options.outputPath, "/")),
            baseUrl: site.url("/"),
            processTerm: ui.processTerm ? ui.processTerm.toString() : undefined,
            processResult: ui.processResult
              ? ui.processResult.toString()
              : undefined,
          };
          const init = document.createElement("script");
          init.setAttribute("type", "text/javascript");
          init.innerHTML =
            `window.addEventListener('DOMContentLoaded', () => { new PagefindUI(${
              JSON.stringify(uiSettings)
            }); });`;
          document.head.append(script, init);
        }
      });
    }
  };
}
