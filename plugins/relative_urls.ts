import { posix } from "../deps/path.ts";
import Site from "../site.ts";
import { Page } from "../filesystem.ts";

export default function () {
  return (site: Site) => {
    site.process([".html"], relativeUrls);

    const basePath = site.options.location.pathname;

    function relativeUrls(page: Page) {
      const { document } = page;
      const from = posix.dirname(site.url(page.dest.path));

      document.querySelectorAll("[href]").forEach((element) => {
        element.setAttribute(
          "href",
          relativeUrl(basePath, from, element.getAttribute("href")),
        );
      });

      document.querySelectorAll("[src]").forEach((element) => {
        element.setAttribute(
          "src",
          relativeUrl(basePath, from, element.getAttribute("src")),
        );
      });

      const srcsetUrlRegex =
        /(?<=^\s*|,\s+|\s,+|\s[^\s,]+,+)[^\s,](?:\S*[^\s,])?/g;

      document.querySelectorAll("[srcset]").forEach((element) => {
        element.setAttribute(
          "srcset",
          element.getAttribute("srcset").replace(
            srcsetUrlRegex,
            (url: string) => relativeUrl(basePath, from, url),
          ),
        );
      });

      document.querySelectorAll("[imagesrcset]").forEach((element) => {
        element.setAttribute(
          "imagesrcset",
          element.getAttribute("imagesrcset").replace(
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
