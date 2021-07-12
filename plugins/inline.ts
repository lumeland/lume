import { Element } from "../deps/dom.ts";
import { extname, posix, resolve } from "../deps/path.ts";
import { encode } from "../deps/base64.ts";
import { Exception, merge, mimes } from "../utils.ts";
import { Page, Site } from "../types.ts";

interface Options {
  extensions: string[];
  attribute: string;
}

// Default options
const defaults: Options = {
  extensions: [".html"],
  attribute: "inline",
};

const cache = new Map();

/**
 * Plugin to inline automatically in the HTML assets
 * like images, javascript, css, svg, etc
 */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process(options.extensions, inline);

    // Update cache
    site.addEventListener("beforeUpdate", (ev) => {
      for (const filename of ev.files!) {
        cache.delete(filename);
      }
    });

    const selector = `[${options.attribute}]`;

    async function inline(page: Page) {
      for (const element of page.document!.querySelectorAll(selector)) {
        await runInline(page.data.url as string, element as Element);
        (element as Element).removeAttribute(options.attribute);
      }
    }

    function runInline(url: string, element: Element) {
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

    function getContent(path: string, asData = false) {
      // Ensure the path starts with "/"
      path = posix.join("/", path);

      if (!cache.has(path)) {
        cache.set(path, readContent(path, asData));
      }

      return cache.get(path);
    }

    async function readContent(path: string, asData: boolean) {
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

    async function inlineStyles(url: string, element: Element) {
      const path = posix.resolve(url, element.getAttribute("href")!);
      const style = element.ownerDocument!.createElement("style");

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

    async function inlineScript(url: string, element: Element) {
      const path = posix.resolve(url, element.getAttribute("src")!);

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

    async function inlineSrc(url: string, element: Element) {
      const path = resolve(url, element.getAttribute("src")!);
      const ext = extname(path);

      try {
        if (ext === ".svg") {
          const content = await getContent(path);
          const div = element.ownerDocument!.createElement("div");
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

    async function inlineHref(url: string, element: Element) {
      const path = resolve(url, element.getAttribute("href")!);

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
