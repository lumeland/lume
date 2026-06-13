import { merge } from "../core/utils/object.ts";
import { Data, Page } from "../core/file.ts";
import { log } from "../core/utils/log.ts";
import { buildIcon } from "../core/utils/image.ts";
import sharp from "../deps/sharp.ts";

import type Site from "../core/site.ts";

export interface Options {
  /**
   * The input file to generate the favicons
   * Accepted formats are SVG, PNG, JPG, GIF, BMP, TIFF, WEBP
   */
  input?: string | Record<number, string>;

  /**
   * The generated favicons
   * By default it follows the recommendations from:
   * https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs
   */
  favicons?: Favicon[];
}

export const defaults = {
  input: "/favicon.svg",
  favicons: [
    {
      url: "/favicon.ico",
      size: [32],
      rel: "icon",
      format: "ico",
    },
    {
      url: "/apple-touch-icon.png",
      size: [180],
      rel: "apple-touch-icon",
      format: "png",
    },
  ],
} satisfies Options;

export interface Favicon {
  url: string;
  size: number[];
  rel: string;
  format: string;
}

/**
 * A plugin to generate favicons from an SVG or PNG file
 * @see https://lume.land/plugins/favicon/
 */
export function favicon(userOptions?: Options) {
  const options = merge(defaults, userOptions);
  const input = typeof options.input === "string"
    ? { 16: options.input }
    : options.input;

  return <D extends Data>(site: Site<D>) => {
    async function getContent(
      file: string,
    ): Promise<Uint8Array<ArrayBuffer> | string | undefined> {
      const content = file.endsWith(".svg")
        ? await site.getContent(file, false)
        : await site.getContent(file, true);

      if (!content) {
        log.warn(`[favicon plugin] Input file not found: ${file}`);
      }

      return content;
    }

    site.process(async function processFaviconImages() {
      const contents: Record<number, Uint8Array<ArrayBuffer> | string> = {};

      for (const [size, file] of Object.entries(input)) {
        const fileContent = await getContent(file);

        if (fileContent) {
          contents[Number(size)] = fileContent;
        }
      }

      if (!Object.keys(contents).length) {
        return;
      }

      const { cache } = site;
      for (const favicon of options.favicons) {
        const page = await site.getOrCreatePage(favicon.url);

        if (page.content) {
          continue;
        }

        const content = getBestContent(contents, favicon.size);

        page.bytes = await buildIcon(
          content,
          favicon.format as keyof sharp.FormatEnum,
          favicon.size,
          cache,
        );
      }

      // Add the svg favicon
      const svg = Object.entries(input)
        .find(([, file]) => file.endsWith(".svg"));
      if (svg) {
        const size = Number(svg[0]);
        const url = input[size];
        const content = contents[size];
        if (
          !site.pages.find((page) => page.data.url === url) &&
          !site.files.find((file) => file.outputPath === url)
        ) {
          site.pushPage(
            Page.create({
              url,
              content,
            }),
          );
        }
      }
    });

    site.process([".html"], function processFaviconPages(pages) {
      const svg = Object.entries(input)
        .find(([, file]) => file.endsWith(".svg"));
      const svgUrl = svg ? input[Number(svg[0])] : null;

      for (const page of pages) {
        const { document } = page;

        for (const favicon of options.favicons) {
          addIcon(document, {
            rel: favicon.rel,
            sizes: favicon.size.map((s) => `${s}x${s}`).join(" "),
            href: site.url(favicon.url),
          });
        }

        if (svgUrl) {
          addIcon(document, {
            rel: "icon",
            sizes: "any",
            href: site.url(svgUrl),
            type: "image/svg+xml",
          });
        }
      }
    });
  };
}

function addIcon(document: Document, attributes: Record<string, string>) {
  const link = document.createElement("link");
  for (const [key, value] of Object.entries(attributes)) {
    link.setAttribute(key, value);
  }
  document.head.appendChild(link);
  document.head.appendChild(document.createTextNode("\n"));
}

function getBestContent(
  content: Record<number, Uint8Array | string>,
  sizes: number[],
): Uint8Array | string {
  const size = Math.min(...sizes);
  const availableSizes = Object.keys(content).map(Number);

  // Find the closest size available
  let bestSize = availableSizes[0];
  for (const s of availableSizes) {
    if (s <= size && s > bestSize) {
      bestSize = s;
    }
  }

  return content[bestSize];
}

export default favicon;
