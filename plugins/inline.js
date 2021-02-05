import { extname, join, relative, resolve } from "../deps/path.js";
import { DOMParser } from "../deps/dom.js";
import { encode } from "../deps/base64.js";
import { mimes } from "../utils.js";

const cache = new Map();

export default function () {
  const parser = new DOMParser();

  return (site) => {
    site.process([".html"], processor);

    //Update cache
    site.addEventListener("beforeUpdate", (ev) => {
      for (const filename of ev.files) {
        cache.delete(filename);
      }
    });

    async function processor(page) {
      if (page.content.includes(" inline")) {
        const document = parser.parseFromString(page.content, "text/html");

        for (const element of document.querySelectorAll("[inline]")) {
          await inline(page.data.url, element);
          // bug: https://github.com/b-fuze/deno-dom/issues/30
          // element.removeAttribute("inline");
          delete element.attributes["inline"];
        }

        page.content = document.documentElement.outerHTML;
      }
    }

    async function inline(url, element) {
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
      //Ensure the path starts with "/"
      path = join("/", path);

      if (cache.has(path)) {
        return cache.get(path);
      }

      const content = await readContent(path, asData);
      cache.set(path, content);
      return content;
    }

    async function readContent(path, asData) {
      const url = join("/", relative(site.options.location.pathname, path));

      //Is a page/asset ?
      const page = site.pages.find((page) => page.data.url === url);

      if (page) {
        return page.content;
      }

      //Is a file in dest
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
      const path = resolve(url, element.getAttribute("href"));
      const style = element.ownerDocument.createElement("style");

      style.innerHTML = await getContent(path);
      element.replaceWith(style);
    }

    async function inlineScript(url, element) {
      const path = resolve(url, element.getAttribute("src"));

      element.innerHTML = await getContent(path);
      // bug: https://github.com/b-fuze/deno-dom/issues/30
      // element.removeAttribute("src");
      delete element.attributes["src"];
    }

    async function inlineSrc(url, element) {
      const path = resolve(url, element.getAttribute("src"));
      const ext = extname(path);

      if (ext === ".svg") {
        const content = await getContent(path);
        const div = element.ownerDocument.createElement("div");
        div.innerHTML = content;
        element.replaceWith(...div.children);
        return;
      }

      element.setAttribute("src", await getContent(path, true));
    }

    async function inlineHref(url, element) {
      const path = resolve(url, element.getAttribute("href"));
      element.setAttribute("href", await getContent(path, true));
    }
  };
}
