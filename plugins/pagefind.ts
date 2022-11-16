import { merge } from "../core/utils.ts";
import { posix } from "../deps/path.ts";
import downloadBinary, { DownloadOptions } from "../deps/pagefind.ts";

import type { DeepPartial, Site } from "../core.ts";

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
}

export interface IndexingOptions {
  /** The folder to output search files into, relative to source. */
  bundleDirectory: string;

  /** The element that Pagefind should treat as the root of the document. */
  rootSelector: string;

  /** Configures the glob used by Pagefind to discover HTML files. */
  glob: string;

  /** Ignores any detected languages and creates a single index for the entire site as the provided language. */
  forceLanguage: string | false;

  /** Prints extra logging while indexing the site. */
  verbose: boolean;

  /** Extra element selectors that Pagefind should ignore when indexing */
  excludeSelectors: string[];
}

export interface Options {
  /** The options to download the binary file */
  binary: DownloadOptions;

  /** Options for the UI interface or false to disable it */
  ui: UIOptions | false;

  /** Options for the indexing process */
  indexing: IndexingOptions;
}

const defaults: Options = {
  binary: {
    path: "./_bin/pagefind",
    extended: false,
    version: "v0.10.0",
  },
  ui: {
    containerId: "search",
    showImages: false,
    showEmptyFilters: true,
    resetStyles: true,
  },
  indexing: {
    bundleDirectory: "pagefind",
    rootSelector: "html",
    glob: "**/*.html",
    forceLanguage: false,
    verbose: false,
    excludeSelectors: [],
  },
};

/** A plugin to generate a static full text search engine */
export default function (userOptions?: DeepPartial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const { ui, indexing } = options;

    if (ui) {
      site.process([".html"], (page) => {
        const { document } = page;
        if (!document) {
          return;
        }
        const container = document.getElementById(ui.containerId);

        // Insert UI styles and scripts
        if (container) {
          const styles = document.createElement("link");
          styles.setAttribute("rel", "stylesheet");
          styles.setAttribute(
            "href",
            site.url(
              `${posix.join(indexing.bundleDirectory, "pagefind-ui.css")}`,
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
              `${posix.join(indexing.bundleDirectory, "pagefind-ui.js")}`,
            ),
          );

          const uiSettings = {
            element: `#${ui.containerId}`,
            showImages: ui.showImages,
            showEmptyFilters: ui.showEmptyFilters,
            resetStyles: ui.resetStyles,
            bundlePath: site.url(posix.join(indexing.bundleDirectory, "/")),
            baseUrl: site.url("/"),
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

    site.addEventListener("afterBuild", async () => {
      const binary = await downloadBinary(options.binary);
      const args = buildArguments(
        options.indexing,
        site.dest(),
      );
      const { code, stdout, stderr } = await Deno.spawn(binary, { args });
      if (code !== 0) {
        throw new Error(
          `Pagefind exited with code ${code}

${stdout}

${stderr}`,
        );
      } else if (options.indexing.verbose) {
        console.log(stdout);
      }
    });
  };
}

function buildArguments(
  options: Options["indexing"],
  source: string,
): string[] {
  const args = [
    "--source",
    source,
    "--bundle-dir",
    options.bundleDirectory,
    "--root-selector",
    options.rootSelector,
    "--glob",
    options.glob,
  ];

  if (options.forceLanguage) {
    args.push("--force-language", options.forceLanguage);
  }

  if (options.excludeSelectors.length > 0) {
    args.push("--exclude-selectors", options.excludeSelectors.join(","));
  }

  if (options.verbose) {
    args.push("--verbose");
  }

  return args;
}
