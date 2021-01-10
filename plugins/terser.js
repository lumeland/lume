import textLoader from "../loaders/text.js";
import minify from "../deps/terser.js";
import { basename } from "../deps/path.js";

export default function (options = {}) {
  return (site) => {
    site.loadAssets([".js"], textLoader);
    site.process([".js"], processor);

    async function processor(file, site) {
      const content = file.content;
      const filename = file.dest.path + file.dest.ext;

      // default options
      const defaults = {
        module: true,
        compress: true,
        mangle: true,
      };

      // merge user-defined options
      options = { ...defaults, ...options };

      if (options.sourceMap) {
        options.sourceMap = {
          filename: filename,
          // filename is path, so just need basename
          url: basename(filename) + ".map",
        };
      }

      const output = await minify(content, options);

      file.content = output.code;

      if (output.map) {
        let mapFile = file.duplicate();
        mapFile.content = output.map;
        mapFile.dest.ext = ".js.map";
        site.pages.push(mapFile);
      }
    }
  };
}
