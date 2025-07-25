import { merge } from "../core/utils/object.ts";
import { concurrent } from "../core/utils/concurrent.ts";
import { Page } from "../core/file.ts";
import { toArrayBuffer } from "../deps/streams.ts";

import type { Extensions } from "../core/utils/path.ts";
import type Site from "../core/site.ts";

export interface Options {
  /** File extensions to compress */
  extensions?: Extensions;
}

// Default options
export const defaults: Options = {
  extensions: [".html", ".css", ".js", ".mjs", ".svg", ".json", ".xml", ".txt"],
};

/**
 * A plugin to compress files with gzip
 */
export function gzip(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process(
      options.extensions,
      function processGzip(pages, allPages) {
        return concurrent(pages, async (page: Page) => {
          const contentStream = ReadableStream.from([page.bytes]);
          const compressedStream = contentStream.pipeThrough(
            new CompressionStream("gzip"),
          );
          const compressedArrayBuffer = await toArrayBuffer(compressedStream);
          const compressedContent = new Uint8Array(compressedArrayBuffer);

          const compressedPage = Page.create({
            url: page.outputPath + ".gz",
            content: compressedContent,
          });
          allPages.push(compressedPage);
        });
      },
    );
  };
}

export default gzip;
