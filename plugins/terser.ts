import { minify } from "../deps/terser.ts";
import { basename } from "../deps/path.ts";
import { Exception, merge } from "../utils.ts";

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

    // Options passed to terser
    const terserOptions = { ...options.options };

    async function terser(file) {
      const content = file.content;
      const filename = file.dest.path + file.dest.ext;

      if (options.sourceMap) {
        terserOptions.sourceMap = {
          filename,
          // Filename is path, so just need basename
          url: basename(filename) + ".map",
        };
      }

      try {
        const output = await minify(content, terserOptions);
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
      const output = await minify(code, terserOptions);
      return output.code;
    }
  };
}
