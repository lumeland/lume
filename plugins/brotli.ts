import { merge } from "../core/utils/object.ts";
import { Page } from "../core/file.ts";
import { compress } from "../deps/brotli.ts";

import type { Extensions } from "../core/utils/path.ts";
import type Site from "../core/site.ts";

export interface Options {
  /** File extensions to compress */
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
    site.process(options.extensions, function processBrotli(pages, allPages) {
      for (const page of pages) {
        const compressedContent = compress(
          page.bytes,
          undefined,
          options.quality,
        );

        allPages.push(Page.create({
          url: page.outputPath + ".br",
          content: compressedContent,
        }));
      }
    });
  };
}

export default brotli;
