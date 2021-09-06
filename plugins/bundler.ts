import { merge } from "../core/utils.ts";
import { Page, Site } from "../core.ts";
import { toFileUrl } from "../deps/path.ts";
import { createGraph, load, LoadResponse } from "../deps/graph.ts";

export interface Options {
  /** List of entry points to bundle */
  entries: string[];

  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Set `true` to generate source map files */
  sourceMap: boolean;

  /** The options for Deno.emit */
  options: Deno.EmitOptions;
}

// Default options
const defaults: Options = {
  entries: [],
  extensions: [".ts", ".js"],
  sourceMap: false,
  options: {},
};

/** A plugin to load all .js and .ts files and bundle them using Deno.emit() */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  // Check configuration
  if (!options.options.bundle) {
    if (options.entries.length) {
      const error = new Error(
        "'entries' option requires `options.bundle` set to 'module' or 'classic'",
      );
      error.name = "Bundler plugin";
      throw error;
    }
  } else if (!options.entries.length) {
    const error = new Error(
      "'option.bundle' option requires at least one value in 'options.entries'",
    );
    error.name = "Bundler plugin";
    throw error;
  }

  return (site: Site) => {
    const sources: Record<string, string> = {};

    site.loadAssets(options.extensions);
    site.process(options.extensions, prepare);

    if (options.options.bundle) {
      site.process(options.extensions, loadGraph);
    }
    site.process(options.extensions, bundler);

    // Prepare the specifiers
    function prepare(file: Page) {
      if (!file._data.url) {
        const url = file.data.url as string;
        file._data.url = url;
        file._data.specifier = toFileUrl(site.src(url)).href;
      }

      const specifier = file._data.specifier as string;
      sources[specifier] = file.content as string;

      // Empty the file if it's not going to be bundled
      // This disable the next processors for this file
      if (options.options.bundle) {
        const url = file._data.url as string;
        if (options.entries.length && !options.entries.includes(url)) {
          file.content = "";
        }
      }
    }

    // Load all dependencies
    async function loadGraph(file: Page) {
      const specifier = file._data.specifier as string;

      await createGraph(specifier, {
        async load(
          specifier: string,
          isDynamic: boolean,
        ): Promise<LoadResponse | undefined> {
          if (isDynamic) {
            return;
          }

          if (specifier in sources) {
            return {
              specifier: specifier,
              content: sources[specifier] || "",
            };
          }

          const response = await load(specifier);

          if (response) {
            sources[response.specifier] = response.content;
            return response;
          }
        },
      });
    }

    // Bundle all files
    async function bundler(file: Page) {
      const specifier = file._data.specifier as string;

      const { files } = await Deno.emit(specifier, {
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
