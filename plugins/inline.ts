import { Element } from "../deps/dom.ts";
import { extname, posix, resolve } from "../deps/path.ts";
import { encode } from "../deps/base64.ts";
import { Exception, merge, mimes } from "../core/utils.ts";
import { Page, Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Attribute used to select the elements this plugin applies to */
  attribute: string;
}

// Default options
const defaults: Options = {
  extensions: [".html"],
  attribute: "inline",
};

const cache = new Map();

/**
 * A plugin to inline the HTML assets,
 * like images, JavaScript, CSS, SVG, etc.
 */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process(options.extensions, inline);

    // Update the cache
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

    function getContent(path: string, asDataUrl = false) {
      // Ensure the path starts with "/"
      path = posix.join("/", path);
      const id = JSON.stringify([path, asDataUrl]);

      if (!cache.has(id)) {
        cache.set(id, readContent(path, asDataUrl));
      }

      return cache.get(id);
    }

    async function readContent(path: string, asDataUrl: boolean) {
      const url = posix.join(
        "/",
        posix.relative(site.options.location.pathname, path),
      );

      const content = await site.getFileContent(url) as string | Uint8Array;

      // Return the raw content
      if (!asDataUrl) {
        if (content instanceof Uint8Array) {
          return new TextDecoder().decode(content);
        }

        return content;
      }

      // Return the data URL
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
      } catch (cause) {
        throw new Exception(
          "Plugin inline: Unable to inline the file",
          { cause, path, url },
        );
      }
    }

    async function inlineScript(url: string, element: Element) {
      const path = posix.resolve(url, element.getAttribute("src")!);

      try {
        element.innerHTML = await getContent(path);
        element.removeAttribute("src");
      } catch (cause) {
        throw new Exception(
          "Plugin inline: Unable to inline the file",
          { cause, path, url },
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
      } catch (cause) {
        throw new Exception(
          "Plugin inline: Unable to inline the file",
          { cause, path, url },
        );
      }
    }

    async function inlineHref(url: string, element: Element) {
      const path = resolve(url, element.getAttribute("href")!);

      try {
        element.setAttribute("href", await getContent(path, true));
      } catch (cause) {
        throw new Exception(
          "Plugin inline: Unable to inline the file",
          { cause, path, url },
        );
      }
    }
  };
}
