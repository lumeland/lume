import { merge } from "../core/utils/object.ts";
import { Page } from "../core/file.ts";
import { log } from "../core/utils/log.ts";
import sharp, { create, sharpsToIco } from "../deps/sharp.ts";

import type Site from "../core/site.ts";
import type Cache from "../core/cache.ts";

export interface Options {
  /**
   * The input file to generate the favicons
   * Accepted formats are SVG, PNG, JPG, GIF, BMP, TIFF, WEBP
   */
  input?: string;

  /**
   * The generated favicons
   * By default it follows the recommendations from:
   * https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs
   */
  favicons?: Favicon[];
}

export const defaults: Options = {
  input: "/favicon.svg",
  favicons: [
    {
      url: "/favicon.ico",
      size: [48],
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
};

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

  return (site: Site) => {
    async function getContent(): Promise<Uint8Array | string | undefined> {
      const content = options.input.endsWith(".svg")
        ? await site.getContent(options.input, false)
        : await site.getContent(options.input, true);

      if (!content) {
        log.warn(`[favicon plugin] Input file not found: ${options.input}`);
      }

      return content;
    }

    site.process(async function processFaviconImages(_, pages) {
      const content = await getContent();

      if (!content) {
        return;
      }

      const { cache } = site;
      for (const favicon of options.favicons) {
        pages.push(
          Page.create({
            url: favicon.url,
            content: await buildIco(
              content,
              favicon.format as keyof sharp.FormatEnum,
              favicon.size,
              cache,
            ),
          }),
        );
      }

      // Add the svg favicon
      if (
        options.input.endsWith(".svg") &&
        !site.pages.find((page) => page.data.url === options.input) &&
        !site.files.find((file) => file.outputPath === options.input)
      ) {
        site.pages.push(
          Page.create({
            url: options.input,
            content: await site.getContent(
              options.input,
              false,
            ),
          }),
        );
      }
    });

    site.process([".html"], function processFaviconPages(pages) {
      for (const page of pages) {
        const { document } = page;

        for (const favicon of options.favicons) {
          addIcon(document, {
            rel: favicon.rel,
            sizes: favicon.size.map((s) => `${s}x${s}`).join(" "),
            href: site.url(favicon.url),
          });
        }

        if (options.input.endsWith(".svg")) {
          addIcon(document, {
            rel: "icon",
            sizes: "any",
            href: site.url(options.input),
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

async function buildIco(
  content: Uint8Array | string,
  format: keyof sharp.FormatEnum | "ico",
  size: number[],
  cache?: Cache,
): Promise<Uint8Array> {
  if (cache) {
    const result = await cache.getBytes([content, format, size]);

    if (result) {
      return result;
    }
  }

  let image: Uint8Array;

  if (format === "ico") {
    const resizeOptions = { background: { r: 0, g: 0, b: 0, alpha: 0 } };
    const img = await create(content);
    image = await sharpsToIco(
      ...size.map((size) => img.clone().resize(size, size, resizeOptions)),
    );
  } else {
    image = await (await create(content))
      .resize(size[0], size[0])
      .toFormat(format)
      .toBuffer();
  }

  if (cache) {
    cache.set([content, format, size], image);
  }

  return image;
}

export default favicon;
