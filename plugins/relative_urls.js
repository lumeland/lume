import { posix } from "../deps/path.js";
import { DOMParser } from "../deps/dom.js";

export default function () {
  const parser = new DOMParser();

  return (site) => {
    site.process([".html"], processor);

    function processor(page) {
      const document = parser.parseFromString(page.content, "text/html");
      const from = posix.dirname(site.url(page.dest.path));

      document
        .querySelectorAll("[src]")
        .forEach((element) => {
          if (element.hasAttribute("src")) {
            element.setAttribute(
              "src",
              relativeUrl(from, element.getAttribute("src")),
            );
          }
        });

      document
        .querySelectorAll("[href]")
        .forEach((element) => {
          if (element.hasAttribute("href")) {
            element.setAttribute(
              "href",
              relativeUrl(from, element.getAttribute("href")),
            );
          }
        });

      page.content = document.documentElement.outerHTML;
    }
  };
}

function relativeUrl(from, to) {
  if (ignore(to)) {
    return to;
  }

  const relative = posix.relative(from, to);

  if (!relative || relative.startsWith("/")) {
    return `.${relative}`;
  }

  return relative;
}

function ignore(url) {
  return !url ||
    url.startsWith("./") ||
    url.startsWith("../") ||
    url.startsWith("#") ||
    url.startsWith("?") ||
    url.includes("//");
}
