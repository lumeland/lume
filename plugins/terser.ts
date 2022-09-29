import { minify } from "../deps/terser.ts";
import { merge, normalizeSourceMap } from "../core/utils.ts";
import { Exception } from "../core/errors.ts";
import { Page } from "../core/filesystem.ts";

import type { DeepPartial, Helper, Site, SourceMap } from "../core.ts";
import type { TerserOptions } from "../deps/terser.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Options passed to `terser` */
  options: TerserOptions;
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
export default function (userOptions?: DeepPartial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadAssets(options.extensions);
    site.process(options.extensions, terser);
    site.filter("terser", filter as Helper, true);

    async function terser(file: Page) {
      const filename = site.src(file.src.path + file.src.ext);
      const content = file.content;
      const terserOptions = {
        ...options.options,
        sourceMap: {
          content: JSON.stringify(file.data.sourceMap),
          filename: filename,
        },
      };

      try {
        const output = await minify({ [filename]: content }, terserOptions);
        file.content = output.code;
        file.data.sourceMap = normalizeSourceMap(
          site.root(),
          JSON.parse(output.map) as SourceMap,
        );
      } catch (cause) {
        throw new Exception(
          "Error processing the file",
          { name: "Plugin Terser", cause, page: file, content },
        );
      }
    }

    async function filter(code: string) {
      const output = await minify(code, options.options);
      return output.code;
    }
  };
}
