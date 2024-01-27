import { merge } from "../core/utils/object.ts";
import binLoader from "../core/loaders/binary.ts";
import textLoader from "../core/loaders/text.ts";
import { Page } from "../core/file.ts";
import Cache from "../core/cache.ts";
import sharp, { sharpsToIco } from "../deps/sharp.ts";

import type Site from "../core/site.ts";

export interface Options {
  /**
   * The input file to generate the favicons
   * Accepted formats are SVG, PNG, JPG, GIF, BMP, TIFF, WEBP
   */
  input?: string;

  /** The cache folder */
  cache?: string | boolean;

  /**
   * The generated favicons
   * By default it follows the recommendations from:
   * https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs
   */
  favicons?: Favicon[];
}

export const defaults: Options = {
  input: "/favicon.svg",
  cache: true,
  favicons: [
    {
      url: "/favicon.ico",
      size: [16, 32],
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

export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    // Configure the cache folder
    const cacheFolder = options.cache === true ? "_cache" : options.cache;
    const cache = cacheFolder
      ? new Cache({ folder: site.src(cacheFolder) })
      : undefined;

    if (cacheFolder) {
      site.ignore(cacheFolder);
      site.options.watcher.ignore.push(cacheFolder);
    }

    async function getContent(): Promise<Uint8Array> {
      const content = await site.getContent(options.input, binLoader);

      if (!content) {
        throw new Error(`File not found: ${options.input}`);
      }

      return typeof content === "string"
        ? new TextEncoder().encode(content)
        : content;
    }

    site.addEventListener("afterRender", async (event) => {
      const content = await getContent();

      for (const favicon of options.favicons) {
        event.pages?.push(
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
        event.pages?.push(
          Page.create({
            url: options.input,
            content: await site.getContent(
              options.input,
              textLoader,
            ) as string,
          }),
        );
      }
    });

    site.process([".html"], (pages) => {
      for (const page of pages) {
        const document = page.document!;

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
  content: Uint8Array,
  format: keyof sharp.FormatEnum | "ico",
  size: number[],
  cache?: Cache,
): Promise<Uint8Array> {
  if (cache) {
    const result = await cache.get(content, { format, size });

    if (result) {
      return result;
    }
  }

  let image: Uint8Array;

  if (format === "ico") {
    const resizeOptions = { background: { r: 0, g: 0, b: 0, alpha: 0 } };
    const img = sharp(content);
    image = await sharpsToIco(
      ...size.map((size) => img.clone().resize(size, size, resizeOptions)),
    );
  } else {
    image = await sharp(content)
      .resize(size[0], size[0])
      .toFormat(format)
      .toBuffer();
  }

  if (cache) {
    cache.set(content, { format, size }, image);
  }

  return image;
}
