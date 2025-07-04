import { merge } from "../core/utils/object.ts";
import { posix } from "../deps/path.ts";
import { Page } from "../core/file.ts";
import { pagefind as Pagefind } from "../deps/pagefind.ts";
import { log } from "../core/utils/log.ts";

import type { CustomRecord, TranslationsOptions } from "../deps/pagefind.ts";
import type Site from "../core/site.ts";

export interface UIOptions {
  /**
   * The container id to insert the search
   * @default "search"
   */
  containerId?: string;

  /**
   * The number of search results to load at once, before a “Load more” button is shown.
   * @default 5
   */
  pageSize?: number;

  /**
   * Include results from page subsections (based on headings with IDs).
   */
  showSubResults?: boolean;

  /** Whether to show an image alongside each search result. */
  showImages?: boolean;

  /**
   * The maximum number of characters to show in the excerpt.
   * `0` means no limit
   */
  excerptLength?: number;

  /**
   * A function that Pagefind UI calls before performing a search.
   * This can be used to normalize search terms to match your content.
   */
  processTerm?: (term: string) => string;

  /**
   * A function that Pagefind UI calls before displaying each result.
   * This can be used to fix relative URLs, rewrite titles,
   * or any other modifications you might like to make to the raw result object
   * returned by Pagefind
   */
  processResult?: (result: unknown) => unknown;

  /**
   * By default, Pagefind UI shows filters with no results alongside the count (0).
   * Pass false to hide filters that have no remaining results.
   */
  showEmptyFilters?: boolean;

  /**
   * The default behavior of the filter display is to show values only when there is one filter with six or fewer values. When you include a filter name in openFilters it will open by default, regardless of the number of filters or values present.
   */
  openFilters?: string[];

  /**
   * By default, Pagefind UI applies a CSS reset to itself.
   * Pass false to omit this and inherit from your site styles.
   */
  resetStyles?: boolean;

  /**
   * The number of milliseconds to wait after a user stops typing before performing a search.
   * If you wish to disable this, set to 0.
   * @default 300
   */
  debounceTimeoutMs?: number;

  /**
   * A set of custom ui strings to use instead of the automatically detected language strings.
   * See https://github.com/CloudCannon/pagefind/blob/main/pagefind_ui/translations/en.json for all available keys and initial values.
   * The items in square brackets such as SEARCH_TERM will be substituted dynamically when the text is used.
   */
  translations?: TranslationsOptions;

  /**
   * Enabling autofocus automatically directs attention to the search input field for
   * enhanced user convenience, particularly beneficial when the UI is loaded within a modal dialog.
   * However, exercise caution, as using autofocus indiscriminately may pose potential
   * accessibility challenges.
   */
  autofocus?: boolean;

  /**
   * Passes sort options to Pagefind for ranking.
   * Note that using a sort will override all ranking by relevance.
   */
  sort?: Record<string, "asc" | "desc">;

  /**
   * Enable the ability to highlight search terms on the result pages.
   * Configure the query parameter name.
   */
  highlightParam?: string;

  /**
   * The global variable name to use for the Pagefind UI instance.
   * This is useful if you need to interact with the UI programmatically.
   */
  globalVariable?: string;
}

export interface Options {
  /** The path to the pagefind bundle directory */
  outputPath?: string;

  /** Options for the UI interface or false to disable it */
  ui?: UIOptions | false;

  /** Options for the indexing process */
  indexing?: Pagefind.PagefindServiceConfig;

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

/**
 * A plugin to generate a static full text search engine
 * @see https://lume.land/plugins/pagefind/
 */
export function pagefind(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process([".html"], async function processPagefind(pages, allPages) {
      const { index } = await Pagefind.createIndex(options.indexing);

      if (!index) {
        throw new Error("Pagefind index not created");
      }

      // Page indexing
      for (const page of pages) {
        const { errors } = await index.addHTMLFile({
          url: page.data.url,
          content: page.content as string,
        });

        if (errors.length > 0) {
          log.error(
            `[pagefind plugin] Indexing errors for ${page.src.path}`,
            errors,
          );
          continue;
        }
      }

      if (options.customRecords) {
        for (const record of options.customRecords) {
          const { errors } = await index.addCustomRecord(record);

          if (errors.length > 0) {
            log.error(
              `[pagefind plugin] Pagefind index errors for custom record`,
              errors,
            );
            continue;
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
          Page.create({
            url: posix.join("/", options.outputPath, path),
            content,
          }),
        );
      }

      // Cleanup
      await index.deleteIndex();
      await Pagefind.close();
    });

    if (options.ui) {
      const { containerId, globalVariable, ...ui } = options.ui;

      site.process([".html"], function processPagefindUI(pages) {
        for (const page of pages) {
          const { document } = page;
          const container = document.getElementById(containerId!);

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
            document.head.append(script);

            const uiSettings = {
              element: `#${containerId}`,
              ...ui,
              bundlePath: site.url(posix.join(options.outputPath, "/")),
              baseUrl: site.url("/"),
              processTerm: ui.processTerm
                ? ui.processTerm.toString()
                : undefined,
              processResult: ui.processResult
                ? ui.processResult.toString()
                : undefined,
            };
            let code = `new PagefindUI(${JSON.stringify(uiSettings)});`;
            if (globalVariable) {
              code = `window["${globalVariable}"] = ${code}`;
            }
            const init = document.createElement("script");
            init.setAttribute("type", "text/javascript");
            init.innerHTML =
              `window.addEventListener('DOMContentLoaded',()=>{${code}});`;
            document.head.append(init);

            if (ui.highlightParam) {
              const highlightScript = document.createElement("script");
              highlightScript.setAttribute("type", "module");
              highlightScript.innerHTML = `
              import "${
                site.url(
                  `${posix.join(options.outputPath, "pagefind-highlight.js")}`,
                )
              }";
              new PagefindHighlight({ highlightParam: ${
                JSON.stringify(ui.highlightParam)
              } });
              `;
              document.head.append(highlightScript);
            }
          }
        }
      });
    }
  };
}

export default pagefind;
