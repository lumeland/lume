import { PurgeCSS, purgeHtml } from "../deps/purgecss.ts";
import { merge } from "../core/utils/object.ts";
import { concurrent } from "../core/utils/concurrent.ts";
import { getExtension, matchExtension } from "../core/utils/path.ts";

import type Site from "../core/site.ts";
import type { Page } from "../core/file.ts";
import type { RawContent, UserDefinedOptions } from "../deps/purgecss.ts";

export interface Options {
  /** The list of page extensions loaded as content. */
  contentExtensions?: string[];

  /** Options for purgecss */
  options?: Partial<UserDefinedOptions>;
}

// Default options
export const defaults: Options = {
  contentExtensions: [".html", ".js"],
  options: {
    extractors: [],
  },
};

/**
 * A plugin to remove unused CSS
 */
export function purgecss(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  options.options.extractors!.push({
    extractor: purgeHtml,
    extensions: ["html"],
  });

  return (site: Site) => {
    site.process([".css"], async (pages, allPages) => {
      const content: RawContent[] = [];
      for (const page of allPages) {
        if (!matchExtension(options.contentExtensions, page.outputPath)) {
          continue;
        }

        const pageContent = page.content;
        if (typeof pageContent !== "string") {
          return;
        }

        content.push({
          raw: pageContent,
          extension: getExtension(page.outputPath).slice(1),
        });
      }

      await concurrent(pages, async (page: Page) => {
        const pageContent = page.content;
        if (typeof pageContent !== "string") {
          return;
        }

        const purgeOptions: UserDefinedOptions = {
          ...options.options,
          content: (options.options.content || []).concat(content),
          css: [
            {
              raw: pageContent,
            },
          ],
        };

        const result = await new PurgeCSS().purge(purgeOptions);

        page.content = result[0].css;
      });
    });
  };
}

export default purgecss;
