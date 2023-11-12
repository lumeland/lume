import { merge } from "../core/utils/object.ts";
import binLoader from "../core/loaders/binary.ts";
import textLoader from "../core/loaders/text.ts";
import { ImageMagick, MagickFormat, MagickGeometry } from "../deps/imagick.ts";
import { Page } from "../core/file.ts";
import Cache from "../core/cache.ts";
import { svg2png } from "../deps/svg2png.ts";

import type Site from "../core/site.ts";
import type { IMagickImage } from "../deps/imagick.ts";

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
      size: 32,
      rel: "icon",
      format: MagickFormat.Ico,
    },
    {
      url: "/apple-touch-icon.png",
      size: 180,
      rel: "apple-touch-icon",
      format: MagickFormat.Png,
    },
  ],
};

export interface Favicon {
  url: string;
  size: number;
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
      const path = options.input;

      // Convert the SVG to PNG
      if (path.endsWith(".svg")) {
        const content = await site.getContent(path, textLoader) as
          | string
          | undefined;

        if (!content) {
          throw new Error(`Favicon: ${path} not found`);
        }

        return await svg2png(content, { width: 180, height: 180 });
      }

      return await site.getContent(path, binLoader) as Uint8Array;
    }

    site.addEventListener("afterRender", async (event) => {
      const content = await getContent();

      if (!(content instanceof Uint8Array)) {
        throw new Error(`Favicon: ${options.input} not found`);
      }

      for (const favicon of options.favicons) {
        const format = favicon.format.toUpperCase() as MagickFormat;
        event.pages?.push(
          Page.create(
            favicon.url,
            await buildIco(content, format, favicon.size, cache),
          ),
        );
      }

      // Add the svg favicon
      if (
        options.input.endsWith(".svg") &&
        !site.pages.find((page) => page.data.url === options.input) &&
        !site.files.find((file) => file.outputPath === options.input)
      ) {
        event.pages?.push(
          Page.create(
            options.input,
            await site.getContent(options.input, textLoader) as string,
          ),
        );
      }
    });

    site.process([".html"], (page) => {
      const document = page.document!;

      if (options.input.endsWith(".svg")) {
        addIcon(document, {
          rel: "icon",
          href: site.url(options.input),
          type: "image/svg+xml",
        });
      }

      for (const favicon of options.favicons) {
        addIcon(document, {
          rel: favicon.rel,
          sizes: `${favicon.size}x${favicon.size}`,
          href: site.url(favicon.url),
        });
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
  format: MagickFormat,
  size: number,
  cache?: Cache,
): Promise<Uint8Array> {
  if (cache) {
    const result = await cache.get(content, { format, size });

    if (result) {
      return result;
    }
  }

  return new Promise((resolve) => {
    ImageMagick.read(content, (image: IMagickImage) => {
      const geometry = new MagickGeometry(size, size);
      image.resize(geometry);

      image.write(format, (output: Uint8Array) => {
        if (cache) {
          cache.set(content, { format, size }, output);
        }
        resolve(new Uint8Array(output));
      });
    });
  });
}
