import { minify } from "../deps/terser.ts";
import { basename } from "../deps/path.ts";
import { Exception, merge } from "../utils.ts";
import Site from "../site.ts";
import { Page } from "../filesystem.ts";
import { Helper } from "../types.ts";

interface Options {
  extensions: string[];
  sourceMap: boolean;
  options: Partial<TerserOptions>;
}

interface TerserOptions {
  module: boolean;
  compress: boolean;
  mangle: boolean;
  sourceMap?: {
    filename: string;
    url: string;
  };
}

// Default options
const defaults: Options = {
  extensions: [".js"],
  sourceMap: false,
  options: {
    module: true,
    compress: true,
    mangle: true,
  },
};

/**
 * Plugin to load all .js files and minify them
 * using Terser
 */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadAssets(options.extensions);
    site.process(options.extensions, terser);
    site.filter("terser", filter as Helper, true);

    async function terser(file: Page) {
      const filename = file.dest.path + file.dest.ext;
      const content = file.content;
      const terserOptions = { ...options.options };

      if (options.sourceMap) {
        terserOptions.sourceMap = {
          filename,
          url: basename(filename) + ".map",
        };
      }

      try {
        const output = await minify({ [filename]: content }, terserOptions);
        file.content = output.code;

        if (output.map) {
          const mapFile = file.duplicate();
          mapFile.content = output.map;
          mapFile.dest.ext = ".js.map";
          site.pages.push(mapFile);
        }
      } catch (err) {
        throw new Exception(
          "Plugin terser: Error processing the file",
          { page: file },
          err,
        );
      }
    }

    async function filter(code: string) {
      const output = await minify(code, options.options);
      return output.code;
    }
  };
}
