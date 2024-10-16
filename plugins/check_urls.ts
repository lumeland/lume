import { merge } from "../core/utils/object.ts";
import { parseSrcset, searchLinks } from "../core/utils/dom_links.ts";
import { gray, green, red } from "../deps/colors.ts";
import { Page } from "../core/file.ts";
import { concurrent } from "../core/utils/concurrent.ts";

import type Site from "../core/site.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];

  /** True to distinguish trailing slashes and oldUrl values (only for internal links) */
  strict?: boolean;

  /** The list of URLs to ignore */
  ignore?: string[];

  /** True to check external links */
  external?: boolean;

  /** To output the list to a json file */
  output?: string;
}

/** Default options */
export const defaults: Options = {
  extensions: [".html"],
  strict: false,
  ignore: [],
  external: false,
};

const cacheExternalUrls = new Map<string, Promise<boolean>>();

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
    const urls = new Set<string>(); // All valid URLs (internal)
    const redirects = new Set<string>(); // All URLs that are redirects
    const external = new Map<string, Set<string>>(); // All external URLs found
    const notFound = new Map<string, Set<string>>();

    function findPath(path: string): boolean {
      if (options.strict) {
        return urls.has(path);
      }

      const cleaned = path === "/" ? path : path.replace(/\/$/, "");

      return urls.has(cleaned) || urls.has(cleaned + "/") ||
        redirects.has(cleaned) || redirects.has(cleaned + "/");
    }

    function scan(url: string, pageUrl: URL): void {
      if (ignore(url)) { // ignore empty, hash, search, etc
        return;
      }

      const fullUrl = new URL(url, pageUrl);

      // External links
      if (fullUrl.origin != pageUrl.origin) {
        if (options.external) {
          fullUrl.hash = "";
          saveRef(external, fullUrl.href, pageUrl.pathname);
        }
        return;
      }

      if (!findPath(fullUrl.pathname)) {
        saveRef(notFound, fullUrl.pathname, pageUrl.pathname);
      }
    }

    function saveRef(
      map: Map<string, Set<string>>,
      href: string,
      pageUrl: string,
    ) {
      const ref = map.get(href) || new Set();
      ref.add(pageUrl);
      map.set(href, ref);
    }

    site.process("*", (pages) => {
      // Clear on rebuild
      urls.clear();
      notFound.clear();
      external.clear();

      for (const page of pages) {
        urls.add(page.data.url);

        if (page.data.oldUrl) {
          if (Array.isArray(page.data.oldUrl)) {
            for (const oldUrl of page.data.oldUrl) {
              redirects.add(oldUrl);
            }
          } else {
            redirects.add(page.data.oldUrl);
          }
        }
      }

      for (const file of site.files) {
        urls.add(file.outputPath);
      }
    });

    site.process(
      options.extensions,
      async (pages) => {
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

        // Check external links
        await concurrent(
          external,
          async ([url, pages]) => {
            if (await checkExternalUrl(url) === false) {
              for (const pageUrl of pages) {
                saveRef(notFound, url, pageUrl);
              }
            }
          },
          20,
        );
      },
    );

    if (options.output) {
      site.addEventListener(
        "beforeSave",
        () => outputResults(notFound, options.output, site),
      );
    } else {
      site.addEventListener("afterUpdate", () => showResults(notFound));
      site.addEventListener("afterBuild", () => showResults(notFound));
    }
  };
}

function checkExternalUrl(url: string): Promise<boolean> {
  let result = cacheExternalUrls.get(url);

  if (!result) {
    result = fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0",
        Accept: "text/html,*/*;q=0.8",
      },
    }).then((response) => response.status !== 404).catch(() => false);
    cacheExternalUrls.set(url, result);
  }

  return result;
}

function outputResults(
  notFound: Map<string, Set<string>>,
  url: string,
  site: Site,
) {
  const content = JSON.stringify(
    Object.fromEntries(
      Array.from(notFound.entries())
        .map(([url, refs]) => [url, Array.from(refs)]),
    ),
    null,
    2,
  );
  site.pages.push(Page.create({ content, url }));
}

function showResults(notFound: Map<string, Set<string>>) {
  if (notFound.size === 0) {
    console.log(green("All links are OK!"));
    return;
  }

  console.log("");
  console.log(`${notFound.size} Broken links:`);
  for (const [url, refs] of notFound) {
    console.log("");
    console.log("⛓️‍💥", red(url));
    console.log("  In the page(s):");
    for (const ref of refs) {
      console.log(`  ${gray(ref)}`);
    }
  }
  console.log("");
}
