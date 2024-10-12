import { merge } from "../core/utils/object.ts";
import { parseSrcset, searchLinks } from "../core/utils/dom_links.ts";
import { gray, green, red } from "../deps/colors.ts";

import type Site from "../core/site.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];

  /** Whether distinguish the trailing slash or not (only for internal links) */
  strict?: boolean;

  /** The list of URLs to ignore */
  ignore?: string[];
}

/** Default options */
export const defaults: Options = {
  extensions: [".html"],
  strict: true,
  ignore: [],
};

/**
 * This plugin checks broken links in *.html output files.
 */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);
  const schemeRegex = /^\w+:/;

  function ignore(url: string) {
    const scheme = url.match(schemeRegex)?.[0];

    if (scheme) {
      return !["http:", "https:"].includes(scheme);
    }

    return !url ||
      options.ignore?.includes(url) ||
      url.startsWith("?") ||
      url.startsWith("#");
  }

  return (site: Site) => {
    const urls = new Set<string>(); // Set is more performant than arrays
    const notFound = new Map<string, string[]>();

    function findPath(path: string): boolean {
      if (options.strict) {
        return urls.has(path);
      }

      const cleaned = path === "/" ? path : path.replace(/\/$/, "");
      return urls.has(cleaned) || urls.has(cleaned + "/");
    }

    function scan(url: string, pageUrl: URL): void {
      if (ignore(url)) { // ignore empty, hash, search, etc
        return;
      }

      const fullUrl = new URL(url, pageUrl);

      // External links
      if (fullUrl.origin != pageUrl.origin) {
        return; // Skip external links
      }

      if (!findPath(fullUrl.pathname)) {
        const ref = notFound.get(fullUrl.pathname) || [];
        ref.push(pageUrl.pathname);
        notFound.set(fullUrl.pathname, ref);
      }
    }

    site.process("*", (pages) => {
      // Clear on rebuild
      urls.clear();
      notFound.clear();

      for (const page of pages) {
        urls.add(page.data.url);
      }
      for (const file of site.files) {
        urls.add(file.outputPath);
      }
    });

    site.process(
      options.extensions,
      (pages) => {
        for (const page of pages) {
          const { document } = page;

          if (!document) {
            return;
          }

          const pageURL = new URL(page.data.url, site.options.location);

          for (const { attribute, value } of searchLinks(document)) {
            if (attribute === "srcset" || attribute === "imagesrcset") {
              for (const [url] of parseSrcset(value)) {
                scan(url, pageURL);
              }
              continue;
            }

            scan(value, pageURL);
          }
        }
      },
    );

    function showResults() {
      if (notFound.size === 0) {
        console.log(green("All links are OK!"));
        return;
      }

      console.log("");
      console.log(`⛓️‍💥 ${notFound.size} Broken links:`);
      for (const [url, refs] of notFound) {
        console.log("");
        console.log(red(url));
        console.log("  In the page(s):");
        for (const ref of refs) {
          console.log(`  ${gray(ref)}`);
        }
      }
      console.log("");
    }

    site.addEventListener("afterUpdate", showResults);
    site.addEventListener("afterBuild", showResults);
  };
}
