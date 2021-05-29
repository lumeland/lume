import { extname, posix, resolve } from "../deps/path.js";
import { encode } from "../deps/base64.js";
import { mimes } from "../utils.js";

const cache = new Map();

export default function () {
  return (site) => {
    site.process([".html"], processor);

    // Update cache
    site.addEventListener("beforeUpdate", (ev) => {
      for (const filename of ev.files) {
        cache.delete(filename);
      }
    });

    async function processor(page) {
      if (!page.content.includes(" inline")) {
        return;
      }

      for (const element of page.document.querySelectorAll("[inline]")) {
        await inline(page.data.url, element);
        element.removeAttribute("inline");
      }
    }

    function inline(url, element) {
      if (element.hasAttribute("href")) {
        if (element.getAttribute("rel") === "stylesheet") {
          return inlineStyles(url, element);
        }

        return inlineHref(url, element);
      }

      if (element.hasAttribute("src")) {
        if (element.nodeName === "SCRIPT") {
          return inlineScript(url, element);
        }

        return inlineSrc(url, element);
      }
    }

    async function getContent(path, asData = false) {
      // Ensure the path starts with "/"
      path = posix.join("/", path);

      if (cache.has(path)) {
        return cache.get(path);
      }

      const content = await readContent(path, asData);
      cache.set(path, content);
      return content;
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
        throw new Error(`Unknown mime type for ${path}`);
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
        throw new Error(
          `Unable to inline the file ${path} from the page ${url}`,
        );
      }
    }

    async function inlineScript(url, element) {
      const path = posix.resolve(url, element.getAttribute("src"));

      try {
        element.innerHTML = await getContent(path);
        element.removeAttribute("src");
      } catch {
        throw new Error(
          `Unable to inline the file ${path} from the page ${url}`,
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
        throw new Error(
          `Unable to inline the file ${path} from the page ${url}`,
        );
      }
    }

    async function inlineHref(url, element) {
      const path = resolve(url, element.getAttribute("href"));

      try {
        element.setAttribute("href", await getContent(path, true));
      } catch {
        throw new Error(
          `Unable to inline the file ${path} from the page ${url}`,
        );
      }
    }
  };
}
