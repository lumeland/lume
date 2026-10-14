import { PurgeCSS, purgeHtml } from "../deps/purgecss.ts";
import { merge } from "@lumeland/core/utils/object.ts";
import { concurrent } from "@lumeland/core/utils/concurrent.ts";
import { getExtension, matchExtension } from "@lumeland/core/utils/path.ts";

import type Site from "@lumeland/core/site.ts";
import type { Page } from "@lumeland/core/file.ts";
import type { RawContent, UserDefinedOptions } from "../deps/purgecss.ts";

export interface Options {
  /** The list of page extensions loaded as content. */
  contentExtensions?: string[];

  /** Options for purgecss */
  options?: Partial<UserDefinedOptions>;
}

// Default options
export const defaults = {
  contentExtensions: [".html", ".js"],
  options: {
    extractors: [],
  },
} satisfies Options;

/**
 * A plugin to remove unused CSS
 */
export function purgecss(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  options.options.extractors!.push({
    // @ts-expect-error: types are not correct
    extractor: purgeHtml,
    extensions: ["html"],
  });

  return (site: Site) => {
    site.process([".css"], async function processPurgeCSS(pages, allPages) {
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
