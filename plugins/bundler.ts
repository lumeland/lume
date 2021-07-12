import { merge } from "../core/utils.ts";
import { Page, Site } from "../core.ts";

interface Options {
  extensions: string[];
  sourceMap: boolean;
  options: Deno.EmitOptions;
}

// Default options
const defaults: Options = {
  extensions: [".ts", ".js"],
  sourceMap: false,
  options: {},
};

/** Plugin to load all .js and .ts files and bundle them using Deno.emit */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadAssets(options.extensions);
    site.process(options.extensions, bundler);

    async function bundler(file: Page) {
      const from = file.dest.path + file.dest.ext;
      const { files } = await Deno.emit(from, {
        ...options.options,
        sources: {
          [from]: file.content as string,
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
