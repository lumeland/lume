import satori, { fontsSpecifier, SatoriOptions } from "../deps/satori.ts";
import { create } from "../deps/sharp.ts";
import { posix } from "../deps/path.ts";
import { resolveInclude } from "../core/utils/path.ts";
import { merge } from "../core/utils/object.ts";
import { read } from "../core/utils/read.ts";
import { Page } from "../core/file.ts";
import loader from "../core/loaders/module.ts";

import "../types.ts";

export interface Options {
  /**
   * Custom includes path to load the layout
   * @default `site.options.includes`
   */
  includes?: string;

  /**
   * The options for Satori to generate the SVG image.
   * @see https://github.com/vercel/satori
   */
  options?: Partial<SatoriOptions>;
}

export const defaults: Options = {
  options: {
    width: 1200,
    height: 600,
    fonts: [],
  },
};

/**
 * A plugin to generate Open Graph images for your pages
 * @see https://lume.land/plugins/og_images/
 */
export function ogImages(userOptions?: Options) {
  return (site: Lume.Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );
    const satoriOptions = options.options as SatoriOptions;

    // Get the cache folder
    const { cache } = site;

    site.process([".html"], async function processOgImages(pages, allPages) {
      if (!satoriOptions.fonts.length) {
        satoriOptions.fonts.push(...await defaultFonts());
      }

      for (const page of pages) {
        const { data } = page;
        const layout = data.openGraphLayout;

        if (!layout) {
          continue;
        }

        const layoutPath = resolveInclude(
          layout,
          options.includes,
          posix.dirname(page.sourcePath),
        );

        const entry = site.fs.entries.get(layoutPath);

        if (!entry) {
          throw new Error(`The layout file "${layoutPath}" doesn't exist`);
        }

        const layoutData = await entry.getContent(loader);
        const template = layoutData.content;

        if (typeof template !== "function") {
          throw new Error(
            `The layout file "${layoutPath}" doesn't have a default export`,
          );
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
      jsx: unknown,
    ): Promise<Uint8Array | undefined> {
      if (cache) {
        const result = await cache.getBytes(["og", jsx]);

        if (result) {
          return result;
        }
      }

      const svg = await satori(jsx, satoriOptions);
      const content = await (await create(svg)).toBuffer();

      if (cache) {
        await cache.set(["og", jsx], content);
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
      data: (await read(
        `${fontsSpecifier}/inter/Inter-Regular.woff`,
        true,
      )).buffer as ArrayBuffer,
    },
    {
      name: "inter",
      weight: 700,
      style: "normal",
      data: (await read(
        `${fontsSpecifier}/inter/Inter-SemiBold.woff`,
        true,
      )).buffer as ArrayBuffer,
    },
  ];
}

export default ogImages;

/** Extends Data interface */
declare global {
  namespace Lume {
    export interface Data {
      /**
       * The layout to generate the Open Graph Image
       * @see https://lume.land/plugins/og_image/
       */
      openGraphLayout?: string;
    }
  }
}
