import { extname, join, resolve } from "../deps/path.js";
import { DOMParser } from "../deps/dom.js";
import { encode } from "../deps/base64.js";
import { mimes } from "../utils.js";

const cache = new Map();

export default function () {
  const parser = new DOMParser();

  return (site) => {
    site.process([".html"], processor);

    async function processor(page) {
      if (page.content.includes(" inline")) {
        const document = parser.parseFromString(page.content, "text/html");

        for (const element of document.querySelectorAll("[inline]")) {
          await inliner(page.data.url, element);
        }

        page.content = document.documentElement.outerHTML;
      }
    }

    async function inliner(url, element) {
      if (
        element.nodeName === "LINK" &&
        element.getAttribute("rel") === "stylesheet"
      ) {
        return inlineStyles(url, element);
      }

      if (element.nodeName === "SCRIPT" && element.hasAttribute("src")) {
        return inlineScript(url, element);
      }

      if (element.nodeName === "IMG" && element.hasAttribute("src")) {
        return inlineImage(url, element);
      }
    }

    function getPath(pageUrl, url) {
      return resolve(pageUrl, url);
    }

    async function getContent(path, text = true) {
      //Ensure the path starts with "/"
      path = join("/", path);

      if (cache.has(path)) {
        return cache.get(path);
      }

      const content = await readContent(path, text);
      cache.set(path, content);
      return content;
    }

    async function readContent(path, text) {
      //Is a page/asset ?
      const page = site.pages.find((page) => page.data.url === path);

      if (page) {
        return page.content;
      }

      //Is a file in dest
      if (text) {
        return Deno.readTextFile(site.dest(path));
      }

      const content = await Deno.readFile(site.dest(path));
      const ext = extname(path);

      if (!mimes.has(ext)) {
        throw new Error(`Unknown mime type for ${path}`);
      }

      return `data:${mimes.get(ext)};base64,${encode(content)}`;
    }

    async function inlineStyles(url, element) {
      const path = getPath(url, element.getAttribute("href"));
      const content = await getContent(path);

      const style = element.ownerDocument.createElement("style");
      style.innerHTML = content;
      element.replaceWith(style);
    }

    async function inlineScript(url, element) {
      const path = getPath(url, element.getAttribute("src"));
      const content = await getContent(path);

      element.innerHTML = content;
      element.removeAttribute("src");
    }

    async function inlineImage(url, element) {
      const path = getPath(url, element.getAttribute("src"));
      const ext = extname(path);

      if (ext === ".svg") {
        const content = await getContent(path);
        const span = element.ownerDocument.createElement("span");
        span.innerHTML = content;
        element.replaceWith(...span.children);
        return;
      }

      const content = await getContent(path, false);

      element.setAttribute("src", content);
    }
  };
}
