import { merge } from "../core/utils.ts";

import type { Element } from "../deps/dom.ts";
import type { Page, Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /**
   * The function to generate the new url
   * @default `(url) => url`
   */
  fn: (url: string, page: Page, element: Element) => string | Promise<string>;
}

// Default options
export const defaults: Options = {
  extensions: [".html"],
  fn: (url) => url,
};

/** A plugin to modify all URLs found in the HTML documents */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  function replace(
    url: string | null,
    page: Page,
    element: Element,
  ): string | Promise<string> {
    return url ? options.fn(url, page, element) : "";
  }

  async function replaceSrcset(
    attr: string | null,
    page: Page,
    element: Element,
  ): Promise<string> {
    const srcset = attr ? attr.trim().split(",") : [];
    const replaced: string[] = [];
    for (const src of srcset) {
      const [, url, rest] = src.trim().match(/^(\S+)(.*)/)!;
      replaced.push(await replace(url, page, element) + rest);
    }

    return replaced.join(", ");
  }

  return (site: Site) => {
    site.process(options.extensions, async (page: Page) => {
      const { document } = page;

      if (!document) {
        return;
      }

      for (const node of document.querySelectorAll("[href]")) {
        const element = node as Element;
        element.setAttribute(
          "href",
          await replace(element.getAttribute("href"), page, element),
        );
      }

      for (const node of document.querySelectorAll("[src]")) {
        const element = node as Element;
        element.setAttribute(
          "src",
          await replace(element.getAttribute("src"), page, element),
        );
      }

      for (const node of document.querySelectorAll("video[poster]")) {
        const element = node as Element;
        element.setAttribute(
          "poster",
          await replace(element.getAttribute("poster"), page, element),
        );
      }

      for (const node of document.querySelectorAll("[srcset]")) {
        const element = node as Element;
        element.setAttribute(
          "srcset",
          await replaceSrcset(element.getAttribute("srcset"), page, element),
        );
      }

      for (const node of document.querySelectorAll("[imagesrcset]")) {
        const element = node as Element;
        element.setAttribute(
          "imagesrcset",
          await replaceSrcset(
            element.getAttribute("imagesrcset"),
            page,
            element,
          ),
        );
      }
    });
  };
}
