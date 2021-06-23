import { minify } from "../deps/terser.js";
import { basename } from "../deps/path.js";
import { Exception, merge } from "../utils.js";

// Default options
const defaults = {
  extensions: [".js"],
  sourceMap: false,
  options: {
    module: true,
    compress: true,
    mangle: true,
  },
};

export default function (userOptions = {}) {
  const options = merge(defaults, userOptions);

  return (site) => {
    site.loadAssets(options.extensions);
    site.process(options.extensions, terser);
    site.filter("terser", filter, true);

    async function terser(file) {
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

    async function filter(code) {
      const output = await minify(code, options.options);
      return output.code;
    }
  };
}
