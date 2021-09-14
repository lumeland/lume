import { Exception, merge } from "../core/utils.ts";
import { Page, Site } from "../core.ts";
import { Element } from "../deps/dom.ts";
import { posix, toFileUrl } from "../deps/path.ts";
import { createGraph, load, LoadResponse } from "../deps/graph.ts";
import { SitePage } from "../core/filesystem.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Attribute used to select the elements this plugin applies to */
  attribute: string;

  /** Set `true` to generate source map files */
  sourceMap: boolean;

  /** The options for Deno.emit */
  options: Deno.EmitOptions;
}

// Default options
const defaults: Options = {
  attribute: "bundle",
  extensions: [".ts", ".js"],
  sourceMap: false,
  options: {},
};

/** A plugin to load all .js and .ts files and bundle them using Deno.emit() */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const sources: Record<string, string> = {};
    const entries: string[] = [];

    site.loadAssets(options.extensions);

    const bundleMode = options.options.bundle;

    /**
     * In the bundle mode, we need to load all the files sources
     * before emit the entries
     */
    if (bundleMode) {
      // Find entries in the HTML documents and save them in `entries`
      const selector = `script[${options.attribute}]`;

      site.process([".html"], (page) => {
        const from = page.data.url as string;

        page.document?.querySelectorAll(selector).forEach((node) => {
          const script = node as Element;

          const src = script.getAttribute("src");

          if (src) {
            const path = posix.resolve(from, src);
            entries.push(toFileUrl(site.src(path)).href);
            script.setAttribute("src", src.replace(/\.(ts|tsx|jsx)$/i, ".js"));
            script.removeAttribute(options.attribute as string);
          }
        });
      });

      // Load all source files and save the content in `sources`
      site.process(options.extensions, (file: Page) => {
        const specifier = getSpecifier(file);
        sources[specifier] = file.content as string;

        if (!entries.includes(specifier)) {
          file.content = "";
        }
      });

      // Load all other dependencies and save the content in `sources`
      site.process(options.extensions, async (file: Page) => {
        const specifier = getSpecifier(file);

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
      });
    }

    // Now we are ready to emit the entries
    site.process(options.extensions, async (file: Page) => {
      const specifier = getSpecifier(file);
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
    });

    function getSpecifier(file: Page) {
      file._data.specifier ||=
        toFileUrl(site.src(file.data.url as string)).href;
      return file._data.specifier as string;
    }
  };
}

/** Replace all .ts, .tsx and .jsx files with .js files */
function fixExtensions(content: string) {
  return content.replaceAll(/\.(ts|tsx|jsx)("|')/ig, ".js$2");
}
