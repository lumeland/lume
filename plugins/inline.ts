// deno-lint-ignore-file no-explicit-any
import { posix } from "../deps/path.ts";
import { encodeBase64 } from "../deps/base64.ts";
import { merge } from "../core/utils/object.ts";
import { log } from "../core/utils/log.ts";
import { concurrent } from "../core/utils/concurrent.ts";
import { contentType } from "../deps/media_types.ts";

import type Site from "../core/site.ts";
import type { Page } from "../core/file.ts";

export interface Options {
  /** List of extra attributes to copy if replacing the element */
  copyAttributes?: (string | RegExp)[];

  /** Whether to include the `sourceURL=inline:...` pragma in the inlined content */
  sourceURL?: boolean;
}

// Default options
export const defaults: Options = {
  copyAttributes: [/^data-/],
  sourceURL: false,
};

const cache = new Map();

/**
 * A plugin to inline the HTML assets,
 * like images, JavaScript, CSS, SVG, etc.
 * @see https://lume.land/plugins/inline/
 */
export function inline(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process([".html"], function processInline(pages) {
      return concurrent(pages, inline);
    });

    site.addEventListener("beforeUpdate", () => cache.clear());

    const selector = `[inline]`;

    async function inline(page: Page) {
      const templateElements = Array.from(
        page.document.querySelectorAll("template"),
      ).flatMap((template) =>
        Array.from(template.content.querySelectorAll(selector))
      );
      for (
        const element of [
          ...Array.from(page.document.querySelectorAll(selector)),
          ...templateElements,
        ]
      ) {
        await runInline(page.data.url, element);
        element.removeAttribute("inline");
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
      const id = JSON.stringify([path, asDataUrl]);

      if (!cache.has(id)) {
        cache.set(id, readContent(path, asDataUrl));
      }

      return cache.get(id);
    }

    async function readContent(url: string, asDataUrl: boolean) {
      const path = getPath(site.options.location.pathname, url);
      const content = await getFileContent(site, path, asDataUrl);

      // Return the raw content or undefined if the file is not found
      if (!asDataUrl || !content) {
        return content;
      }

      // Return the data URL
      const ext = posix.extname(path);
      const type = contentType(ext);

      if (!type) {
        log.warn(`[Inline plugin] Unknown file format ${path}`);
        return;
      }

      return `data:${type};base64,${encodeBase64(content)}`;
    }

    function migrateAttributes(
      from: Element,
      to: Element,
      attributes: string[],
    ) {
      for (const { name, value } of Array.from(from.attributes)) {
        const shouldCopy = [...attributes, ...options.copyAttributes].some(
          (attr) => (attr instanceof RegExp ? attr.test(name) : attr === name),
        );

        if (!shouldCopy) {
          continue;
        }

        if (name == "class") {
          to.classList.add(
            ...value.split(" ").filter((value: string) => value != ""),
          );
        } else if (!to.hasAttribute(name)) {
          to.setAttribute(name, value);
        }
      }
    }

    async function inlineStyles(url: string, element: Element) {
      const path = getPath(url, element.getAttribute("href")!);
      const style = element.ownerDocument!.createElement("style");

      migrateAttributes(element, style, ["id", "class", "nonce", "title"]);

      try {
        let content = await getContent(path);
        if (element.hasAttribute("media")) {
          content = `@media ${element.getAttribute("media")} { ${content} }`;
        }
        if (options.sourceURL) {
          content += `\n/*# sourceURL=inline:${path} */`;
        }
        style.innerHTML = content;
        element.replaceWith(style);
      } catch (cause: any) {
        log.error(
          `[Inline plugin] Unable to inline the file <gray>${path}</gray> in the page <gray>${url}</gray> (${cause.message})})`,
        );
      }
    }

    async function inlineScript(url: string, element: Element) {
      const path = getPath(url, element.getAttribute("src")!);

      try {
        let content = await getContent(path);
        if (options.sourceURL) {
          content += `\n//# sourceURL=inline:${path}`;
        }
        element.textContent = content;
        element.removeAttribute("src");
      } catch (cause: any) {
        log.error(
          `[Inline plugin] Unable to inline the file <gray>${path}</gray> in the page <gray>${url}</gray> (${cause.message})})`,
        );
      }
    }

    async function inlineSrc(url: string, element: Element) {
      const path = getPath(url, element.getAttribute("src")!);
      const ext = posix.extname(path);

      try {
        if (ext === ".svg") {
          const content = await getContent(path);
          const div = element.ownerDocument!.createElement("div");
          div.innerHTML = content;
          const svg = div.firstElementChild;

          if (svg) {
            const width = parseInt(element.getAttribute("width") || "0");
            const height = parseInt(element.getAttribute("height") || "0");
            const viewBox = svg.getAttribute("viewBox")?.split(" ");

            if (width && height) {
              svg.setAttribute("width", String(width));
              svg.setAttribute("height", String(height));
            } else if (width) {
              svg.setAttribute("width", String(width));
              if (viewBox?.length === 4) {
                const ratio = width / parseInt(viewBox[2]);
                svg.setAttribute(
                  "height",
                  String(parseInt(viewBox[3]) * ratio),
                );
              }
            } else if (height) {
              svg.setAttribute("height", String(height));
              if (viewBox?.length === 4) {
                const ratio = height / parseInt(viewBox[3]);
                svg.setAttribute("width", String(parseInt(viewBox[2]) * ratio));
              }
            }

            migrateAttributes(element, svg, ["id", "class", "width", "height"]);

            element.replaceWith(svg);
          }
          return;
        }

        element.setAttribute("src", await getContent(path, true));
      } catch (cause: any) {
        log.error(
          `[Inline plugin] Unable to inline the file <gray>${path}</gray> in the page <gray>${url}</gray> (${cause.message})})`,
        );
      }
    }

    async function inlineHref(url: string, element: Element) {
      const path = getPath(url, element.getAttribute("href")!);

      try {
        element.setAttribute("href", await getContent(path, true));
      } catch (cause: any) {
        log.error(
          `[Inline plugin] Unable to inline the file <gray>${path}</gray> in the page <gray>${url}</gray> (${cause.message})})`,
        );
      }
    }
  };
}

/** Returns the content of a file or page */
async function getFileContent(
  site: Site,
  url: string,
  binary: boolean,
): Promise<string | Uint8Array | undefined> {
  const content = await site.getContent(url, binary);

  if (!content) {
    log.warn(`[Inline plugin] Unable to find the file "${url}"`);
  }

  return content;
}

function getPath(baseUrl: string, url: string): string {
  return posix.join("/", posix.resolve(baseUrl, url));
}

export default inline;
