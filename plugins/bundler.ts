import { merge } from "../core/utils.ts";
import { Page, Site } from "../core.ts";
import { walk } from "../deps/fs.ts";

export interface Options {
  /** Only output these entry files */
  entries: string[];

  /** Extra includes imported */
  includes: (string | URL)[];

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
  includes: [],
  extensions: [".ts", ".js"],
  sourceMap: false,
  options: {},
};

/** A plugin to load all .js and .ts files and bundle them using Deno.emit() */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return async (site: Site) => {
    site.loadAssets(options.extensions);
    site.process(options.extensions, prepare);
    site.process(options.extensions, bundler);

    // Check configuration
    if (!options.options.bundle) {
      if (options.entries.length) {
        throw new Error(
          "[bundle] You must set `options.bundle` to 'module' or 'classic' to use `entries`",
        );
      }

      if (options.includes.length) {
        throw new Error(
          "[bundle] You must set `options.bundle` to 'module' or 'classic' to use `includes`",
        );
      }
    } else if (!options.entries.length) {
      throw new Error(
        "[bundle] You must set at least one `entries` to use `options.bundle`",
      );
    }

    const includesSources = await downloadIncludes(options.includes);
    let pageSources: Record<string, string> = {};

    // Clean the pageSources
    site.addEventListener("beforeUpdate", () => {
      pageSources = {};
    });

    function prepare(file: Page) {
      if (!file._data.url) {
        file._data.url = file.data.url;
      }

      const path = file._data.url as string;

      if (options.options.bundle) {
        pageSources[path] = file.content as string;

        // Empty the file if it's not going to be bundled
        if (options.entries.length && !options.entries.includes(path)) {
          file.content = "";
        }
      }
    }

    async function bundler(file: Page) {
      const from = file._data.url as string;

      if (options.entries.length && !options.entries.includes(from)) {
        return;
      }

      const sources = {
        ...includesSources,
        ...pageSources,
        ...options.options.sources,
        [from]: file.content as string,
      };

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

/** A loader to load all .js and .ts files and bundle them using Deno.emit() */
async function downloadIncludes(
  includes: (string | URL)[],
): Promise<Record<string, string>> {
  if (includes.length) {
    console.log(`[bundle] Loading ${includes.length} includes`);
  }

  const result: Record<string, string> = {};

  await Promise.all(includes.map(async (url) => {
    if (url instanceof URL) {
      const response = await fetch(url);
      result[url.href] = await response.text();
      return;
    }

    for await (const entry of walk(url, { includeDirs: false })) {
      result[`/${entry.path}`] = await Deno.readTextFile(entry.path);
    }
  }));

  return result;
}
