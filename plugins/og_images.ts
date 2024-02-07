import satori, { SatoriOptions } from "../deps/satori.ts";
import sharp from "../deps/sharp.ts";
import Cache from "../core/cache.ts";
import { merge } from "../core/utils/object.ts";
import { read } from "../core/utils/read.ts";
import { Page } from "../core/file.ts";

import type { React } from "../deps/react.ts";
import "../types.ts";

type OGImageTemplate = (data: Lume.Data) => React.ReactNode;

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];

  /** The cache folder */
  cache: string | boolean;

  /**
   * The options for Satory to generate the SVG image.
   * @see https://github.com/vercel/satori
   */
  satori?: SatoriOptions;
}

export const defaults: Options = {
  extensions: [".html"],
  cache: true,
  satori: {
    width: 1200,
    height: 627,
    fonts: [],
  },
};

export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Lume.Site) => {
    // Configure the cache folder
    const cacheFolder = options.cache === true ? "_cache" : options.cache;
    const cache = cacheFolder
      ? new Cache({ folder: site.src(cacheFolder) })
      : undefined;

    if (cacheFolder) {
      site.ignore(cacheFolder);
      site.options.watcher.ignore.push(cacheFolder);
    }

    site.process(options.extensions, async (pages, allPages) => {
      if (!options.satori.fonts.length) {
        options.satori.fonts.push(...await defaultFonts());
      }

      for (const page of pages) {
        const { data } = page;
        const template = data.ogImageTemplate;

        if (!template) {
          continue;
        }

        const jsx = await template(data);
        const content = await render(jsx);
        const url = page.outputPath.replace(/\.html$/, ".png");

        allPages.push(Page.create({ url, content }));

        if (!data.metas) {
          data.metas = {};
        }

        data.metas.image = url;
      }
    });

    async function render(
      jsx: React.ReactNode,
    ): Promise<Uint8Array | undefined> {
      if (cache) {
        const result = await cache.get(new Uint8Array(), jsx);

        if (result) {
          return result;
        }
      }

      const svg = await satori(jsx, options.satori);
      const content = await sharp(new TextEncoder().encode(svg)).toBuffer();

      if (cache) {
        await cache.set(new Uint8Array(), jsx, content);
      }

      return content;
    }
  };
}

async function defaultFonts(): Promise<SatoriOptions["fonts"]> {
  return [
    {
      name: "inter",
      weight: 400,
      style: "normal",
      data: await read(
        "https://cdn.jsdelivr.net/npm/@xz/fonts@1/serve/src/inter/Inter-Regular.woff",
        true,
      ),
    },
    {
      name: "inter",
      weight: 700,
      style: "normal",
      data: await read(
        "https://cdn.jsdelivr.net/npm/@xz/fonts@1/serve/src/inter/Inter-SemiBold.woff",
        true,
      ),
    },
  ];
}

/** Extends Data interface */
declare global {
  namespace Lume {
    export interface Data {
      /**
       * Template to generate the og_image
       * @see https://lume.land/plugins/og_image/
       */
      ogImageTemplate?: OGImageTemplate;
    }
  }
}
