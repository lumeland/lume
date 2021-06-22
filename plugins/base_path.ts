export default function () {
  return (site) => {
    site.process([".html"], basePath);

    function fixPath(path) {
      return path.startsWith("/") ? site.url(path) : path;
    }

    function basePath(page) {
      if (site.options.location.pathname === "/") {
        return;
      }

      const { document } = page;

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
            (url) => fixPath(url),
          ),
        );
      });

      document.querySelectorAll("[imagesrcset]").forEach((element) => {
        element.setAttribute(
          "imagesrcset",
          element.getAttribute("imagesrcset").replace(
            srcsetUrlRegex,
            (url) => fixPath(url),
          ),
        );
      });
    }
  };
}
