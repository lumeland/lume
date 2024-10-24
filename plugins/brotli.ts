import { merge } from "../core/utils/object.ts";
import { Page } from "../core/file.ts";
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
    site.process(options.extensions, (pages, allPages) => {
      const textEncoder = new TextEncoder();

      for (const page of pages) {
        const content = page.content!;

        const contentByteArray = typeof content === "string"
          ? textEncoder.encode(content)
          : content;

        const compressedContent = compress(
          contentByteArray,
          undefined,
          options.quality,
        );

        const compressedPage = Page.create({
          url: page.outputPath + ".br",
          content: compressedContent,
        });
        allPages.push(compressedPage);
      }
    });
  };
}

export default brotli;
