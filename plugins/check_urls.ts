import { merge } from "../core/utils/object.ts";
import { parseSrcset, searchLinks } from "../core/utils/dom_links.ts";
import { gray, green, red } from "../deps/colors.ts";
import { join } from "../deps/path.ts";
import { concurrent } from "../core/utils/concurrent.ts";
import { log } from "../core/utils/log.ts";
import { decodeURIComponentSafe } from "../core/utils/path.ts";

import type Site from "../core/site.ts";

export interface Options {
  /** True to require trailing slashes and ignore redirections (oldUrl variables) */
  strict?: boolean;

  /** True to throw if an invalid url is found */
  throw?: boolean;

  /** The list of URLs to ignore */
  ignore?: string[];

  /** True to check external links */
  external?: boolean;

  /** To output the list to a json file */
  output?: string | ((notFoundUrls: Map<string, Set<string>>) => void);
}

/** Default options */
export const defaults: Options = {
  strict: false,
  throw: false,
  ignore: [],
  external: false,
};

const cacheExternalUrls = new Map<string, Promise<boolean>>();
const cacheInternalUrls = new Map<string, boolean>();

/**
 * This plugin checks broken links in *.html output files.
 */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);
  const schemeRegex = /^\w+:/;

  function ignore(url: string) {
    const scheme = url.match(schemeRegex)?.[0];

    if (scheme && !["http:", "https:"].includes(scheme)) {
      return true;
    }

    return !url ||
      options.ignore?.includes(url) ||
      url.startsWith("?") ||
      url.startsWith("#");
  }

  return (site: Site) => {
    const urls = new Map<string, Set<string>>(); // All URLs found
    const redirects = new Set<string>(); // All URLs that redirect

    // Ignore the ouput file to avoid infinite build loop
    if (typeof options.output === "string") {
      site.options.watcher.ignore.push(options.output);
    }

    function scan(url: string, pageUrl: URL): void {
      if (ignore(url)) { // ignore empty, hash, search, etc
        return;
      }

      const fullUrl = new URL(url, pageUrl);

      // External links
      if (fullUrl.origin !== pageUrl.origin) {
        if (options.external) {
          fullUrl.hash = "";
          saveRef(urls, url, pageUrl.pathname);
        }
        return;
      }

      saveRef(urls, fullUrl.pathname, pageUrl.pathname);
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

    // Search for redirect URLs non-strict mode
    if (!options.strict) {
      site.process((pages) => {
        for (const page of pages) {
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
      });
    }

    // Search for URLs in all pages
    site.process(
      [".html"],
      (pages) => {
        for (const page of pages) {
          const { document } = page;
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

    async function checkUrls(): Promise<void> {
      const strict = options.strict;
      const notFound = new Map<string, Set<string>>();
      const dest = site.dest();

      log.info("Searching for broken links...");

      await concurrent(
        urls,
        async ([url, refs]) => {
          if (url.startsWith("http")) {
            if (!await checkExternalUrl(url)) {
              notFound.set(url, refs);
            }
            return;
          }

          if (!strict) {
            const cleaned = url === "/" ? url : url.replace(/\/$/, "");
            if (redirects.has(cleaned) || redirects.has(cleaned + "/")) {
              return;
            }
          }

          if (!checkInternalUrl(url, dest, strict)) {
            notFound.set(url, refs);
          }
        },
      );

      // Output
      if (typeof options.output === "function") {
        options.output(notFound);
      } else if (typeof options.output === "string") {
        outputFile(notFound, options.output);
      } else {
        outputConsole(notFound);
      }

      const report = site.debugBar?.collection("Url checker");
      if (report) {
        report.icon = "link-break";
        report.contexts = {
          "broken link": {
            background: "error",
          },
        };

        for (const [url, refs] of notFound) {
          report.items.push({
            title: url,
            context: "broken link",
            items: Array.from(refs).map((ref) => ({
              title: ref,
              actions: [
                {
                  text: "Open",
                  href: ref,
                },
              ],
            })),
          });
        }
      }

      // Clear cache
      cacheInternalUrls.clear();
      urls.clear();
      redirects.clear();

      if (notFound.size > 0 && options.throw) {
        throw `${notFound.size} broken link(s)`;
      }
    }

    site.addEventListener("afterUpdate", checkUrls);
    site.addEventListener("afterBuild", checkUrls);
  };
}

function checkInternalUrl(
  url: string,
  dest: string,
  strict: boolean,
): boolean {
  const cached = cacheInternalUrls.get(url);

  if (cached !== undefined) {
    return cached;
  }

  let result = false;

  if (url.endsWith("/")) {
    try {
      Deno.statSync(join(dest, decodeURIComponentSafe(url), "index.html"));
      result = true;
    } catch {
      // Ignore error
    }
  } else {
    try {
      Deno.statSync(join(dest, decodeURIComponentSafe(url)));
      result = true;
    } catch {
      if (!strict) {
        result = checkInternalUrl(join(url, "/index.html"), dest, true);
      }
    }
  }
  cacheInternalUrls.set(url, result);
  return result;
}

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0",
  Accept: "text/html,*/*;q=0.8",
};

function checkExternalUrl(url: string): Promise<boolean> {
  let result = cacheExternalUrls.get(url);

  if (!result) {
    result = fetch(url, {
      method: "HEAD",
      headers,
    }).then((response) => {
      if (response.status !== 404) {
        return true;
      }
      // Retry again with GET method (some servers don't support HEAD)
      return fetch(url, { method: "GET", headers }).then((response) =>
        response.status !== 404
      );
    }).catch(() => false);
    cacheExternalUrls.set(url, result);
  }

  return result;
}

function outputFile(
  notFound: Map<string, Set<string>>,
  file: string,
) {
  const content = JSON.stringify(
    Object.fromEntries(
      Array.from(notFound.entries())
        .map(([url, refs]) => [url, Array.from(refs)]),
    ),
    null,
    2,
  );
  Deno.writeTextFileSync(file, content);

  if (notFound.size === 0) {
    log.info("No broken links found!");
  } else {
    log.info(
      `⛓️‍💥 ${notFound.size} broken links saved to <gray>${file}</gray>`,
    );
  }
}

function outputConsole(notFound: Map<string, Set<string>>) {
  if (notFound.size === 0) {
    console.log(green("All links are OK!"));
    return;
  }

  console.log("");
  console.log(`${notFound.size} broken link(s):`);
  for (const [url, refs] of notFound) {
    console.log("");
    console.log("⛓️‍💥", red(url));
    console.log("   Found in:");
    for (const ref of refs) {
      console.log(`   ${gray(ref)}`);
    }
  }
  console.log("");
}
