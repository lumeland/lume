import { merge } from "../core/utils/object.ts";
import { Page } from "../core/file.ts";
import { pageMatches } from "../core/processors.ts";
import { gzip as compress, Memory } from "../deps/foras.ts";

import type { Extensions } from "../core/utils/path.ts";
import type Site from "../core/site.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: Extensions;

  /**
   * Level param between 0 and 9 (9 is the smallest but takes the longest to encode)
   */
  level?: number;
}

// Default options
export const defaults: Options = {
  extensions: [".html", ".css", ".js", ".mjs", ".svg", ".json", ".xml", ".txt"],
  level: 6,
};

/**
 * A plugin to compress files with gzip
 */
export function gzip(userOptions?: Options) {
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
          new Memory(textEncoder.encode(content)),
          options.level,
        ).copyAndDispose();

        const compressedPage = Page.create({
          url: page.outputPath + ".gz",
          content: compressedContent,
        });

        site.pages.push(compressedPage);
      }
    });
  };
}

export default gzip;
