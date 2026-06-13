import satori, { fontsSpecifier, SatoriOptions } from "../deps/satori.ts";
import { create } from "../deps/sharp.ts";
import { posix } from "../deps/path.ts";
import { resolveInclude } from "../core/utils/path.ts";
import { log } from "../core/utils/log.ts";
import { isPlainObject, merge } from "../core/utils/object.ts";
import { read } from "../core/utils/read.ts";
import { Data, Page } from "../core/file.ts";
import loader from "../core/loaders/module.ts";
import Site from "../core/site.ts";
import { MetasPluginData } from "./metas.ts";

export interface OgImagesPluginData<D extends Data> extends MetasPluginData<D> {
  /**
   * The layout to generate the Open Graph Image
   * @see https://lume.land/plugins/og_image/
   */
  openGraphLayout?: string;
}

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

export const defaults = {
  options: {
    width: 1200,
    height: 600,
    fonts: [],
  },
} satisfies Options;

/**
 * A plugin to generate Open Graph images for your pages
 * @see https://lume.land/plugins/og_images/
 */
export function ogImages(userOptions?: Options) {
  return <D extends OgImagesPluginData<D>>(site: Site<D>) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );
    const satoriOptions = options.options as SatoriOptions;

    // Get the cache folder
    const { cache } = site;

    site.process([".html"], async function processOgImages(pages) {
      if (!satoriOptions.fonts.length) {
        satoriOptions.fonts.push(...await defaultFonts());
      }

      for (const page of pages) {
        const { data } = page;
        const layout = data.openGraphLayout;

        if (!layout) {
          continue;
        }

        if (typeof layout !== "string") {
          log.warn(
            `[og_images] Expected 'openGraphLayout' to be a string. Skipping page.`,
          );
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

        site.pushPage(Page.create({ url, content }));

        let metas: Record<string, unknown>;

        if (isPlainObject(data.metas)) {
          metas = data.metas;
        } else {
          metas = data.metas = {};
        }

        metas.image = url;
      }
    });

    async function render(
      jsx: unknown,
    ): Promise<Uint8Array<ArrayBuffer> | undefined> {
      if (cache) {
        const result = await cache.getBytes(["og", jsx]);

        if (result) {
          return result;
        }
      }

      const svg = await satori(jsx, satoriOptions);
      const content = await create(svg).toBuffer();

      if (cache) {
        await cache.set(["og", jsx], content);
      }

      return content as Uint8Array<ArrayBuffer>;
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
      )).buffer,
    },
    {
      name: "inter",
      weight: 700,
      style: "normal",
      data: (await read(
        `${fontsSpecifier}/inter/Inter-SemiBold.woff`,
        true,
      )).buffer,
    },
  ];
}

export default ogImages;

/** Extends Data interface */
declare global {
  namespace Lume {
    export interface Data extends OgImagesPluginData<Data> {}
  }
}
