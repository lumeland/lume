import { merge } from "@lumeland/core/utils/object.ts";
import { Page } from "@lumeland/core/file.ts";
import { concurrent } from "@lumeland/core/utils/concurrent.ts";
import { toArrayBuffer } from "../deps/streams.ts";

import type { Extensions } from "@lumeland/core/utils/path.ts";
import type Site from "@lumeland/core/site.ts";

export interface Options {
  /** Compression format */
  format?: "brotli" | "gzip";
  /** File extensions to compress */
  extensions?: Extensions;
}

// Default options
export const defaults = {
  format: "gzip",
  extensions: [".html", ".css", ".js", ".mjs", ".svg", ".json", ".xml", ".txt"],
} satisfies Options;

/**
 * A plugin to compress files with brotli
 */
export function compress(userOptions?: Options) {
  const options = merge(defaults, userOptions);
  const ext = options.format === "brotli" ? ".br" : ".gz";
  return (site: Site) => {
    site.process(options.extensions, function processBrotli(pages, allPages) {
      return concurrent(pages, async (page: Page) => {
        // @ts-expect-error: ReadableStream.from() not included in the types
        const contentStream = ReadableStream.from([page.bytes]);
        const compressedStream = contentStream.pipeThrough(
          new CompressionStream(options.format as CompressionFormat),
        );
        const compressedArrayBuffer = await toArrayBuffer(compressedStream);
        const compressedContent = new Uint8Array(compressedArrayBuffer);

        const compressedPage = Page.create({
          url: page.outputPath + ext,
          content: compressedContent,
        });
        allPages.push(compressedPage);
      });
    });
  };
}

export default compress;
