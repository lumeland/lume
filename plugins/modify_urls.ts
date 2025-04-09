import { merge } from "../core/utils/object.ts";
import { concurrent } from "../core/utils/concurrent.ts";
import { parseSrcset, searchLinks } from "../core/utils/dom_links.ts";
import { walkUrls } from "../core/utils/css_urls.ts";

import type Site from "../core/site.ts";
import type { Page } from "../core/file.ts";

export interface Options {
  /**
   * The function to generate the new url
   * @default `(url) => url`
   */
  fn: (url: string, page: Page, element?: Element) => string | Promise<string>;
}

// Default options
export const defaults: Options = {
  fn: (url) => url,
};

/**
 * A plugin to modify all URLs found in HTML and CSS documents
 * @see https://lume.land/plugins/modify_urls/
 */
export function modifyUrls(userOptions: Options) {
  const options = merge(defaults, userOptions);

  function replace(
    url: string | null,
    page: Page,
    element?: Element,
  ): string | Promise<string> {
    return url ? options.fn(url, page, element) : "";
  }

  async function replaceSrcset(
    attr: string,
    page: Page,
    element: Element,
  ): Promise<string> {
    const replaced: string[] = [];
    for (const [url, rest] of parseSrcset(attr)) {
      replaced.push(await replace(url, page, element) + rest);
    }
    return replaced.join(", ");
  }

  return (site: Site) => {
    site.process(
      [".html", ".css"],
      (pages) =>
        concurrent(pages, async (page: Page) => {
          if (page.outputPath.endsWith(".css")) {
            page.text = await walkUrls(
              page.text,
              async (url, type) => {
                if (type === "url") {
                  return await replace(url, page);
                }

                return url;
              },
            );
            return;
          }

          const { document } = page;

          for (const { element, attribute, value } of searchLinks(document)) {
            if (attribute === "srcset" || attribute === "imagesrcset") {
              element.setAttribute(
                attribute,
                await replaceSrcset(value, page, element),
              );
              continue;
            }

            element.setAttribute(
              attribute,
              await replace(value, page, element),
            );
          }
        }),
    );
  };
}

export default modifyUrls;
