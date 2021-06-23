import Site from "../site.ts";
import { Page } from "../filesystem.ts";

export default function () {
  return (site: Site) => {
    site.process([".html"], basePath);

    function fixPath(path: string) {
      return path.startsWith("/") ? site.url(path) : path;
    }

    function basePath(page: Page) {
      if (site.options.location.pathname === "/") {
        return;
      }

      const { document } = page;

      if (!document) {
        return;
      }

      document.querySelectorAll("[href]").forEach((element) => {
        element.setAttribute(
          "href",
          fixPath(element.getAttribute("href")),
        );
      });

      document.querySelectorAll("[src]").forEach((element) => {
        element.setAttribute(
          "src",
          fixPath(element.getAttribute("src")),
        );
      });

      const srcsetUrlRegex =
        /(?<=^\s*|,\s+|\s,+|\s[^\s,]+,+)[^\s,](?:\S*[^\s,])?/g;

      document.querySelectorAll("[srcset]").forEach((element) => {
        element.setAttribute(
          "srcset",
          element.getAttribute("srcset").replace(
            srcsetUrlRegex,
            (url: string) => fixPath(url),
          ),
        );
      });

      document.querySelectorAll("[imagesrcset]").forEach((element) => {
        element.setAttribute(
          "imagesrcset",
          element.getAttribute("imagesrcset").replace(
            srcsetUrlRegex,
            (url: string) => fixPath(url),
          ),
        );
      });
    }
  };
}
