import { minify } from "../deps/terser.ts";
import { merge } from "../core/utils/object.ts";
import { Page } from "../core/file.ts";
import { prepareAsset, saveAsset } from "./source_maps.ts";

import type Site from "../core/site.ts";
import type { MinifyOptions } from "../deps/terser.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];

  /**
   * Options passed to `terser`
   * @see https://terser.org/docs/api-reference/#minify-options
   */
  options?: MinifyOptions;
}

// Default options
export const defaults: Options = {
  extensions: [".js"],
  options: {
    module: true,
    compress: true,
    mangle: true,
  },
};

/** A plugin to load all JavaScript files and minify them using Terser */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadAssets(options.extensions);
    site.process(options.extensions, (pages) => pages.forEach(terser));
    site.filter("terser", filter, true);

    async function terser(page: Page) {
      const { content, filename, sourceMap, enableSourceMap } = prepareAsset(
        site,
        page,
      );

      const terserOptions = {
        ...options.options,
        sourceMap: enableSourceMap
          ? {
            content: JSON.stringify(sourceMap),
            filename: filename,
          }
          : undefined,
      };

      try {
        const output = await minify({ [filename]: content }, terserOptions);
        saveAsset(
          site,
          page,
          output.code!,
          // @ts-expect-error: terser uses @jridgewell/gen-mapping, which incorrectly has typed some types as nullable: https://github.com/jridgewell/gen-mapping/pull/9
          output.map,
        );
      } catch (cause) {
        throw new Error(
          `Error processing the file: ${filename} by the Terser plugin.`,
          { cause },
        );
      }
    }

    async function filter(code: string): Promise<string | undefined> {
      const output = await minify(code, options.options);
      return output.code;
    }
  };
}

/** Extends PageHelpers interface */
declare global {
  namespace Lume {
    export interface PageHelpers {
      /** @see https://lume.land/plugins/terser/#the-terser-filter */
      terser: (code: string) => Promise<string | undefined>;
    }
  }
}
