export default function () {
  return (site) => {
    site.process([".html"], processor);

    const { pathname } = site.options.location;

    function processor(page) {
      if (pathname === "/") {
        return;
      }

      const { document } = page;

      document.querySelectorAll("[href]").forEach((element) => {
        element.setAttribute(
          "href",
          basePath(element.getAttribute("href")),
        );
      });

      document.querySelectorAll("[src]").forEach((element) => {
        element.setAttribute(
          "src",
          basePath(element.getAttribute("src")),
        );
      });

      const srcsetUrlRegex =
        /(?<=^\s*|,\s+|\s,+|\s[^\s,]+,+)[^\s,](?:\S*[^\s,])?/g;

      document.querySelectorAll("[srcset]").forEach((element) => {
        element.setAttribute(
          "srcset",
          element.getAttribute("srcset").replace(
            srcsetUrlRegex,
            (url) => basePath(url),
          ),
        );
      });

      document.querySelectorAll("[imagesrcset]").forEach((element) => {
        element.setAttribute(
          "imagesrcset",
          element.getAttribute("imagesrcset").replace(
            srcsetUrlRegex,
            (url) => basePath(url),
          ),
        );
      });
    }
  };

  function basePath(path) {
    return site.url(path);
  }
}
