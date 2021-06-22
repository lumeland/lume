import { extname, posix, resolve } from "../deps/path.js";
import { encode } from "../deps/base64.js";
import { Exception, merge, mimes } from "../utils.js";

// Default options
const defaults = {
  extensions: [".html"],
  attribute: "inline",
};

const cache = new Map();

export default function (userOptions = {}) {
  const options = merge(defaults, userOptions);

  return (site) => {
    site.process(options.extensions, inline);

    // Update cache
    site.addEventListener("beforeUpdate", (ev) => {
      for (const filename of ev.files) {
        cache.delete(filename);
      }
    });

    const selector = `[${options.attribute}]`;

    async function inline(page) {
      for (const element of page.document.querySelectorAll(selector)) {
        await runInline(page.data.url, element);
        element.removeAttribute(options.attribute);
      }
    }

    function runInline(url, element) {
      if (element.hasAttribute("href")) {
        return element.getAttribute("rel") === "stylesheet"
          ? inlineStyles(url, element)
          : inlineHref(url, element);
      }

      if (element.hasAttribute("src")) {
        return element.nodeName === "SCRIPT"
          ? inlineScript(url, element)
          : inlineSrc(url, element);
      }
    }

    function getContent(path, asData = false) {
      // Ensure the path starts with "/"
      path = posix.join("/", path);

      if (!cache.has(path)) {
        cache.set(path, readContent(path, asData));
      }

      return cache.get(path);
    }

    async function readContent(path, asData) {
      const url = posix.join(
        "/",
        posix.relative(site.options.location.pathname, path),
      );

      // Is a page/asset ?
      const page = site.pages.find((page) => page.data.url === url);

      if (page) {
        return page.content;
      }

      // Is a file in dest
      if (!asData) {
        return Deno.readTextFile(site.dest(url));
      }

      const content = await Deno.readFile(site.dest(url));
      const ext = extname(path);

      if (!mimes.has(ext)) {
        throw new Exception(
          "Plugin inline: Unknown file format",
          { path, available: mimes },
        );
      }

      return `data:${mimes.get(ext)};base64,${encode(content)}`;
    }

    async function inlineStyles(url, element) {
      const path = posix.resolve(url, element.getAttribute("href"));
      const style = element.ownerDocument.createElement("style");

      try {
        style.innerHTML = await getContent(path);
        element.replaceWith(style);
      } catch {
        throw new Exception(
          "Plugin inline: Unable to inline the file",
          { path, url },
        );
      }
    }

    async function inlineScript(url, element) {
      const path = posix.resolve(url, element.getAttribute("src"));

      try {
        element.innerHTML = await getContent(path);
        element.removeAttribute("src");
      } catch {
        throw new Exception(
          "Plugin inline: Unable to inline the file",
          { path, url },
        );
      }
    }

    async function inlineSrc(url, element) {
      const path = resolve(url, element.getAttribute("src"));
      const ext = extname(path);

      try {
        if (ext === ".svg") {
          const content = await getContent(path);
          const div = element.ownerDocument.createElement("div");
          div.innerHTML = content;
          element.replaceWith(...div.children);
          return;
        }

        element.setAttribute("src", await getContent(path, true));
      } catch {
        throw new Exception(
          "Plugin inline: Unable to inline the file",
          { path, url },
        );
      }
    }

    async function inlineHref(url, element) {
      const path = resolve(url, element.getAttribute("href"));

      try {
        element.setAttribute("href", await getContent(path, true));
      } catch {
        throw new Exception(
          "Plugin inline: Unable to inline the file",
          { path, url },
        );
      }
    }
  };
}
