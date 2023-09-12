import { posix } from "../deps/path.ts";
import { encode } from "../deps/base64.ts";
import { log, merge } from "../core/utils.ts";
import binaryLoader from "../core/loaders/binary.ts";
import textLoader from "../core/loaders/text.ts";
import { contentType } from "../deps/media_types.ts";

import type { Loader, Page, Site } from "../core.ts";
import type { Element, HTMLTemplateElement } from "../deps/dom.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Attribute used to select the elements this plugin applies to */
  attribute: string;

  /** List of extra attributes to copy if replacing the element */
  copyAttributes: (string | RegExp)[];
}

// Default options
export const defaults: Options = {
  extensions: [".html"],
  attribute: "inline",
  copyAttributes: [/^data-/],
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
      const templateElements = [...page.document!.querySelectorAll("template")]
        .flatMap((template) => {
          return (template as HTMLTemplateElement).content.querySelectorAll(
            selector,
          );
        });
      for (
        const element of [
          ...page.document!.querySelectorAll(selector),
          ...templateElements,
        ]
      ) {
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

      const content = await getFileContent(
        site,
        url,
        asDataUrl ? binaryLoader : textLoader,
      );

      // Return the raw content
      if (!asDataUrl) {
        return content;
      }

      // Return the data URL
      const ext = posix.extname(path);
      const type = contentType(ext);

      if (!type) {
        log.warning(`[Inline plugin] Unknown file format ${path}`);
        return;
      }

      return `data:${type};base64,${encode(content)}`;
    }

    function migrateAttributes(
      from: Element,
      to: Element,
      attributes: string[],
    ) {
      for (const { name, value } of from.attributes) {
        const shouldCopy = [...attributes, ...options.copyAttributes].some(
          (attr) => attr instanceof RegExp ? attr.test(name) : attr === name,
        );
        if (shouldCopy && !to.hasAttribute(name)) {
          to.setAttribute(name, value);
        }
      }
    }

    async function inlineStyles(url: string, element: Element) {
      const path = posix.resolve(url, element.getAttribute("href")!);
      const style = element.ownerDocument!.createElement("style");

      migrateAttributes(element, style, ["id", "class", "nonce", "title"]);

      try {
        let content = await getContent(path);
        if (element.hasAttribute("media")) {
          content = `@media ${element.getAttribute("media")} { ${content} }`;
        }
        style.innerHTML = content;
        element.replaceWith(style);
      } catch (cause) {
        log.error(
          `[Inline plugin] Unable to inline the file <dim>${path}</dim> in the page <dim>${url}</dim> (${cause.message})})`,
        );
      }
    }

    async function inlineScript(url: string, element: Element) {
      const path = posix.resolve(url, element.getAttribute("src")!);

      try {
        element.textContent = await getContent(path);
        element.removeAttribute("src");
      } catch (cause) {
        log.error(
          `[Inline plugin] Unable to inline the file <dim>${path}</dim> in the page <dim>${url}</dim> (${cause.message})})`,
        );
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
            const width = parseInt(element.getAttribute("width") || "0");
            const height = parseInt(element.getAttribute("height") || "0");
            const viewBox = svg.getAttribute("viewBox")?.split(" ");

            if (width && height) {
              svg.setAttribute("width", width);
              svg.setAttribute("height", height);
            } else if (width) {
              svg.setAttribute("width", width);
              if (viewBox?.length === 4) {
                const ratio = width / parseInt(viewBox[2]);
                svg.setAttribute("height", parseInt(viewBox[3]) * ratio);
              }
            } else if (height) {
              svg.setAttribute("height", height);
              if (viewBox?.length === 4) {
                const ratio = height / parseInt(viewBox[3]);
                svg.setAttribute("width", parseInt(viewBox[2]) * ratio);
              }
            }

            migrateAttributes(element, svg, ["id", "class", "width", "height"]);

            element.replaceWith(svg);
          }
          return;
        }

        element.setAttribute("src", await getContent(path, true));
      } catch (cause) {
        log.error(
          `[Inline plugin] Unable to inline the file <dim>${path}</dim> in the page <dim>${url}</dim> (${cause.message})})`,
        );
      }
    }

    async function inlineHref(url: string, element: Element) {
      const path = posix.resolve(url, element.getAttribute("href")!);

      try {
        element.setAttribute("href", await getContent(path, true));
      } catch (cause) {
        log.error(
          `[Inline plugin] Unable to inline the file <dim>${path}</dim> in the page <dim>${url}</dim> (${cause.message})})`,
        );
      }
    }
  };
}

/** Returns the content of a file or page */
async function getFileContent(
  site: Site,
  url: string,
  loader: Loader,
): Promise<string | Uint8Array> {
  const content = await site.getContent(url, loader);

  if (!content) {
    throw new Error(`Unable to find the file "${url}"`);
  }

  return content;
}
