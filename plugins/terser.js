import textLoader from "../loaders/text.js";
import minify from "../deps/terser.js";
import { basename } from "../deps/path.js";
import { error, merge } from "../utils.js";

// default options
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
    site.loadAssets(options.extensions, textLoader);
    site.process(options.extensions, processor);

    async function processor(file) {
      const content = file.content;
      const filename = file.dest.path + file.dest.ext;

      // options passed to terser
      const terserOptions = { ...options.options };

      if (options.sourceMap) {
        terserOptions.sourceMap = {
          filename: filename,
          // filename is path, so just need basename
          url: basename(filename) + ".map",
        };
      }

      try {
        const output = await minify(content, terserOptions);
        file.content = output.code;

        if (output.map) {
          let mapFile = file.duplicate();
          mapFile.content = output.map;
          mapFile.dest.ext = ".js.map";
          site.pages.push(mapFile);
        }
      } catch (err) {
        error("terser", `Error in file ${filename}`, err);
      }
    }
  };
}
