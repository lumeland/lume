import { merge } from "../utils.ts";

// Default options
const defaults = {
  extensions: [".ts", ".js"],
  sourceMap: false,
  options: {},
};

export default function (userOptions = {}) {
  const options = merge(defaults, userOptions);

  return (site) => {
    site.loadAssets(options.extensions);
    site.process(options.extensions, bundler);

    async function bundler(file) {
      const from = site.src(file.src.path + file.src.ext);
      const { files } = await Deno.emit(from, {
        ...options,
        sources: {
          [from]: file.content,
        },
      });

      for (const [path, content] of Object.entries(files)) {
        if (path.endsWith(".js")) {
          file.content = content;
          file.dest.ext = ".js";
          continue;
        }

        if (options.sourceMap && path.endsWith(".map")) {
          const mapFile = file.duplicate();
          mapFile.content = content;
          mapFile.dest.ext = ".js.map";
          site.pages.push(mapFile);
          continue;
        }
      }
    }
  };
}
