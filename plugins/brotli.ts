import { merge } from "../core/utils/object.ts";
import { Page } from "../core/file.ts";
import { pageMatches } from "../core/processors.ts";
import { compress } from "../deps/brotli.ts";

import type { Extensions } from "../core/utils/path.ts";
import type Site from "../core/site.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: Extensions;

  /**
   * Quality param between 0 and 11 (11 is the smallest but takes the longest to encode)
   */
  quality?: number;
}

// Default options
export const defaults: Options = {
  extensions: [".html", ".css", ".js", ".mjs", ".svg", ".json", ".xml", ".txt"],
  quality: 6,
};

/**
 * A plugin to compress files with brotli
 */
export function brotli(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.addEventListener("beforeSave", () => {
      const textEncoder = new TextEncoder();

      for (const page of site.pages) {
        if (!pageMatches(options.extensions, page)) {
          continue;
        }

        const content = page.content as string;
        const compressedContent = compress(
          textEncoder.encode(content),
          undefined,
          options.quality,
        );

        const compressedPage = Page.create({
          url: page.outputPath + ".br",
          content: compressedContent,
        });

        site.pages.push(compressedPage);
      }
    });
  };
}

export default brotli;
