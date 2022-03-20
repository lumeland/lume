import { posix } from "../deps/path.ts";
import { encode } from "../deps/base64.ts";
import { merge, mimes } from "../core/utils.ts";
import binaryLoader from "../core/loaders/binary.ts";

import type { Element } from "../deps/dom.ts";
import type { Page, Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Attribute used to select the elements this plugin applies to */
  attribute: string;
}

// Default options
export const defaults: Options = {
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

    site.addEventListener("beforeUpdate", () => cache.clear());

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

      const content = await getFileContent(site, url) as string | Uint8Array;

      // Return the raw content
      if (!asDataUrl) {
        if (content instanceof Uint8Array) {
          return new TextDecoder().decode(content);
        }

        return content;
      }

      // Return the data URL
      const ext = posix.extname(path);

      if (!mimes.has(ext)) {
        site.logger.warn("Unknown file format", {
          name: "Inline plugin",
          path,
          url,
          available: mimes,
        });
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
        site.logger.warn("Unable to inline the file", {
          name: "Inline plugin",
          cause,
          path,
          url,
        });
      }
    }

    async function inlineScript(url: string, element: Element) {
      const path = posix.resolve(url, element.getAttribute("src")!);

      try {
        element.innerHTML = await getContent(path);
        element.removeAttribute("src");
      } catch (cause) {
        site.logger.warn("Unable to inline the file", {
          name: "Inline plugin",
          cause,
          path,
          url,
        });
      }
    }

    async function inlineSrc(url: string, element: Element) {
      const path = posix.resolve(url, element.getAttribute("src")!);
      const ext = posix.extname(path);

      try {
        if (ext === ".svg") {
          const content = await getContent(path);
          const div = element.ownerDocument!.createElement("div");
          div.innerHTML = content;
          const svg = div.firstElementChild;

          if (svg) {
            if (!svg.className) {
              svg.className = element.className;
            }

            if (!svg.id) {
              svg.id = element.id;
            }

            element.replaceWith(svg);
          }
          return;
        }

        element.setAttribute("src", await getContent(path, true));
      } catch (cause) {
        site.logger.warn("Unable to inline the file", {
          name: "Inline plugin",
          cause,
          path,
          url,
        });
      }
    }

    async function inlineHref(url: string, element: Element) {
      const path = posix.resolve(url, element.getAttribute("href")!);

      try {
        element.setAttribute("href", await getContent(path, true));
      } catch (cause) {
        site.logger.warn("Unable to inline the file", {
          name: "Inline plugin",
          cause,
          path,
          url,
        });
      }
    }
  };
}

/** Returns the content of a file or page */
async function getFileContent(
  site: Site,
  url: string,
): Promise<string | Uint8Array> {
  // Is a loaded file
  const page = site.pages.find((page) => page.data.url === url);

  if (page) {
    return page.content as string | Uint8Array;
  }

  // Is a static file
  const entry = site.staticFiles.searchReverse(url);

  if (entry) {
    const content = await site.reader.read(entry[0], binaryLoader);
    return content.content as Uint8Array;
  }

  // Is a source file
  const content = await site.reader.read(url, binaryLoader);
  return content.content as Uint8Array;
}
