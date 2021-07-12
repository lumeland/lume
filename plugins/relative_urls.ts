import { Element } from "../deps/dom.ts";
import { posix } from "../deps/path.ts";
import { Page, Site } from "../types.ts";

/** Plugin to convert all internal urls to relative */
export default function () {
  return (site: Site) => {
    site.process([".html"], relativeUrls);

    const basePath = site.options.location.pathname;

    function relativeUrls(page: Page) {
      const document = page.document!;
      const from = posix.dirname(site.url(page.dest.path));

      document.querySelectorAll("[href]").forEach((node) => {
        const element = node as Element;
        element.setAttribute(
          "href",
          relativeUrl(basePath, from, element.getAttribute("href")!),
        );
      });

      document.querySelectorAll("[src]").forEach((node) => {
        const element = node as Element;
        element.setAttribute(
          "src",
          relativeUrl(basePath, from, element.getAttribute("src")!),
        );
      });

      const srcsetUrlRegex =
        /(?<=^\s*|,\s+|\s,+|\s[^\s,]+,+)[^\s,](?:\S*[^\s,])?/g;

      document.querySelectorAll("[srcset]").forEach((node) => {
        const element = node as Element;
        element.setAttribute(
          "srcset",
          element.getAttribute("srcset")!.replace(
            srcsetUrlRegex,
            (url: string) => relativeUrl(basePath, from, url),
          ),
        );
      });

      document.querySelectorAll("[imagesrcset]").forEach((node) => {
        const element = node as Element;
        element.setAttribute(
          "imagesrcset",
          element.getAttribute("imagesrcset")!.replace(
            srcsetUrlRegex,
            (url: string) => relativeUrl(basePath, from, url),
          ),
        );
      });
    }
  };
}

function relativeUrl(basePath: string, from: string, to: string) {
  if (ignore(to)) {
    return to;
  }

  if (!to.startsWith(basePath)) {
    to = posix.join(basePath, to);
  }

  const relative = posix.relative(from, to);
  return !relative || relative.startsWith("/") ? `.${relative}` : relative;
}

function ignore(url: string) {
  return !url ||
    url.startsWith("./") ||
    url.startsWith("../") ||
    url.startsWith("?") ||
    url.startsWith("#") ||
    url.startsWith("data:") ||
    url.includes("//");
}
