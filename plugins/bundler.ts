import { Exception, merge } from "../core/utils.ts";
import { Page, Site } from "../core.ts";
import { toFileUrl } from "../deps/path.ts";
import { createGraph, load, LoadResponse } from "../deps/graph.ts";
import { SitePage } from "../core/filesystem.ts";

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
      throw new Exception(
        "'entries' option requires `options.bundle` set to 'module' or 'classic'",
      ).setName("Bundler plugin");
    }
  } else if (!options.entries.length) {
    throw new Exception(
      "'option.bundle' option requires at least one value in 'options.entries'",
    ).setName("Bundler plugin");
  }

  return (site: Site) => {
    const sources: Record<string, string> = {};

    site.loadAssets(options.extensions);
    site.process(options.extensions, prepare);
    if (options.options.bundle) {
      site.process(options.extensions, loadGraph);
    }
    site.process(options.extensions, bundler);

    // Transform the entries to specifiers
    const entries = options.entries.map((path) =>
      toFileUrl(site.src(path)).href
    );
    const notFoundEntries = entries.concat();

    // Throw and exception is for not found entries
    site.addEventListener("beforeSave", () => {
      if (notFoundEntries.length) {
        throw new Exception(
          "Some entries have not been found",
          { notFoundEntries },
        ).setName("Bundler plugin");
      }
    });

    // Prepare the specifiers
    function prepare(file: Page) {
      file._data.specifier ||=
        toFileUrl(site.src(file.data.url as string)).href;

      const specifier = file._data.specifier as string;

      if (options.options.bundle) {
        sources[specifier] = file.content as string;
      }

      const entryIndex = notFoundEntries.indexOf(specifier);

      if (entryIndex !== -1) {
        notFoundEntries.splice(entryIndex, 1);
      } else if (entries.length) {
        file.content = "";
      }
    }

    // Load all dependencies and save them in `sources`
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
        sources: {
          ...sources,
          [specifier]: file.content as string,
        },
      });

      const content = files[specifier] || files[specifier + ".js"] ||
        files["deno:///bundle.js"];

      if (content) {
        file.content = fixExtensions(content);
        file.dest.ext = ".js";
      }

      const mapContent = files[specifier + ".map"] ||
        files[specifier + ".js.map"] || files["deno:///bundle.js.map"];

      if (options.sourceMap && mapContent) {
        const mapFile = new SitePage();
        mapFile.dest = {
          path: file.dest.path,
          ext: ".js.map",
        };
        mapFile.content = mapContent;
        site.pages.push(mapFile);
      }
    }
  };
}

/** Replace all .ts, .tsx and .jsx files with .js files */
function fixExtensions(content: string) {
  return content.replaceAll(/\.(ts|tsx|jsx)("|')/ig, ".js$2");
}
