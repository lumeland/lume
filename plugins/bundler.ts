import { merge } from "../core/utils.ts";
import { Page, Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Set `true` to generate source map files */
  sourceMap: boolean;

  /** The options for Deno.emit */
  options: Deno.EmitOptions;
}

// Default options
const defaults: Options = {
  extensions: [".ts", ".js"],
  sourceMap: false,
  options: {},
};

/** A plugin to load all .js and .ts files and bundle them using Deno.emit() */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadAssets(options.extensions);
    site.process(options.extensions, bundler);

    let allSources: Record<string, string>;

    // Collect all sources before run the bundler
    if (options.options.bundle) {
      site.addEventListener("afterRender", () => {
        allSources = {};

        site.pages.forEach((file) => {
          if (options.extensions.includes(file.src.ext!)) {
            const path = file.data.url as string;
            allSources[path] = file.content as string;
          }
        });
      });
    }

    async function bundler(file: Page) {
      if (!file._data.url) {
        file._data.url = file.data.url;
      }

      const from = file._data.url as string;
      const sources = allSources || { [from]: file.content as string };
      const { files } = await Deno.emit(from, {
        ...options.options,
        sources,
      });

      for (const [path, content] of Object.entries(files)) {
        if (path.endsWith(".js")) {
          file.content = fixExtensions(content);
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

/** Replace all .ts, .tsx and .jsx files with .js files */
function fixExtensions(content: string) {
  return content.replaceAll(/\.(ts|tsx|jsx)("|')/ig, ".js$2");
}
