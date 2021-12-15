import { minify, TerserOptions } from "../deps/terser.ts";
import { basename } from "../deps/path.ts";
import { Exception, merge } from "../core/utils.ts";
import { Helper, Site } from "../core.ts";
import { Page } from "../core/filesystem.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Set `true` to generate source map files */
  sourceMap: boolean;

  /** Options passed to `terser` */
  options: Partial<TerserOptions>;
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

/** A plugin to load all JavaScript files and minify them using Terser */
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
          const mapFile = new Page();
          mapFile.dest = {
            path: file.dest.path,
            ext: ".js.map",
          };
          mapFile.content = output.map;
          site.pages.push(mapFile);
        }
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
