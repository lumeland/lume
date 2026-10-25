import satori, { SatoriOptions } from "../deps/satori.ts";
import { getInclude } from "@lumeland/core/utils/includes.ts";
import { merge } from "@lumeland/core/utils/object.ts";
import { read } from "@lumeland/core/utils/read.ts";
import { Page } from "@lumeland/core/file.ts";
import loader from "@lumeland/core/loaders/module.ts";
import { posix } from "../deps/path.ts";
import { Resvg } from "../deps/resvg.ts";
import { fonts } from "../deps/fonts.ts";

import type Site from "@lumeland/core/site.ts";
import type { Helper } from "@lumeland/core/renderer.ts";

export interface Options {
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
  return (site: Site) => {
    const options = merge(defaults, userOptions);
    const satoriOptions = options.options as SatoriOptions;

    // Get the cache folder
    const { cache } = site;

    site.process<{ openGraphLayout?: string; metas?: { image?: string } }>(
      [".html"],
      async function processOgImages(pages, allPages) {
        if (!satoriOptions.fonts.length) {
          satoriOptions.fonts.push(...(await defaultFonts()));
        }

        const helpers: Record<string, Helper> = {};

        for (const [name, [fn]] of site.renderer.helpers) {
          helpers[name] = fn;
        }

        for (const page of pages) {
          const { data } = page;
          const layout = data.openGraphLayout;

          if (!layout) {
            continue;
          }

          const entry = getInclude(posix.dirname(page.sourcePath), layout, site.fs);

          if (!entry) {
            throw new Error(`The layout file "${layout}" doesn't exist`);
          }

          const layoutData = await entry.getContent(loader);
          const template = layoutData.content;

          if (typeof template !== "function") {
            throw new Error(`The layout file "${entry.path}" doesn't have a default export`);
          }

          const jsx = await template(data, helpers);
          const content = await render(jsx);
          const url = page.outputPath.replace(/\.html$/, ".png");

          allPages.push(Page.create({ url, content }));

          if (!data.metas) {
            data.metas = {};
          }

          data.metas.image = url;
        }
      },
    );

    async function render(jsx: unknown): Promise<Uint8Array | undefined> {
      if (cache) {
        const result = cache.getBytes(["og", jsx]);

        if (result) {
          return result;
        }
      }

      const svg = await satori(jsx, satoriOptions);
      const content = toPng(svg);

      if (cache) {
        cache.set(["og", jsx], content);
      }

      return content;
    }
  };
}

async function defaultFonts(): Promise<SatoriOptions["fonts"]> {
  return Promise.all(
    fonts.map(async (font) => ({
      name: font.name,
      weight: font.weight,
      style: font.style,
      data: (await read(font.url, true)).buffer as ArrayBuffer,
    })),
  );
}

export function toPng(svg: string): Uint8Array {
  const resvg = new Resvg(svg, { fitTo: { mode: "original" } });
  const pngData = resvg.render();
  return pngData.asPng();
}

export default ogImages;

/** Extends global data interface */
declare global {
  namespace Lume {
    export interface GlobalData {
      /**
       * The layout to generate the Open Graph Image
       * @see https://lume.land/plugins/og_image/
       */
      openGraphLayout?: string;
    }
  }
}
