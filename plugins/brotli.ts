import { merge } from "../core/utils/object.ts";
import { Page } from "../core/file.ts";
import { concurrent } from "../core/utils/concurrent.ts";
import { toArrayBuffer } from "../deps/streams.ts";

import type { Extensions } from "../core/utils/path.ts";
import type Site from "../core/site.ts";

export interface Options {
  /** File extensions to compress */
  extensions?: Extensions;
}

// Default options
export const defaults = {
  extensions: [".html", ".css", ".js", ".mjs", ".svg", ".json", ".xml", ".txt"],
} satisfies Options;

/**
 * A plugin to compress files with brotli
 */
export function brotli(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process(
      options.extensions,
      function processBrotli(pages, allPages) {
        return concurrent(pages, async (page: Page) => {
          const contentStream = ReadableStream.from([page.bytes]);
          const compressedStream = contentStream.pipeThrough(
            // @ts-ignore: https://github.com/denoland/deno/issues/34324
            new CompressionStream("brotli"),
          );
          const compressedArrayBuffer = await toArrayBuffer(compressedStream);
          const compressedContent = new Uint8Array(compressedArrayBuffer);

          const compressedPage = Page.create({
            url: page.outputPath + ".br",
            content: compressedContent,
          });
          allPages.push(compressedPage);
        });
      },
    );
  };
}

export default brotli;
