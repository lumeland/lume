import { Element } from "../deps/dom.ts";
import { Page, Site } from "../core.ts";

/** Plugin to prepend automatically a base path to all internal urls */
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

      const document = page.document!;

      document.querySelectorAll("[href]").forEach((node) => {
        const element = node as Element;

        element.setAttribute(
          "href",
          fixPath(element.getAttribute("href")!),
        );
      });

      document.querySelectorAll("[src]").forEach((node) => {
        const element = node as Element;

        element.setAttribute(
          "src",
          fixPath(element.getAttribute("src")!),
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
            (url: string) => fixPath(url),
          ),
        );
      });

      document.querySelectorAll("[imagesrcset]").forEach((node) => {
        const element = node as Element;

        element.setAttribute(
          "imagesrcset",
          element.getAttribute("imagesrcset")!.replace(
            srcsetUrlRegex,
            (url: string) => fixPath(url),
          ),
        );
      });
    }
  };
}
