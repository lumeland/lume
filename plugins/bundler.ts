import { merge } from "../utils.ts";
import Site from "../site.ts";
import { Page } from "../filesystem.ts";

interface Options {
  extensions?: string[],
  sourceMap?: boolean,
  options?: Deno.EmitOptions,
}

// Default options
const defaults = {
  extensions: [".ts", ".js"],
  sourceMap: false,
  options: {},
};

export default function (userOptions: Options = {}) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadAssets(options.extensions);
    site.process(options.extensions, bundler);

    async function bundler(file: Page) {
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
          file.dest.ext = ".ts";
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
