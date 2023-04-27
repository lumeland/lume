import { merge, normalizePath, replaceExtension } from "../core/utils.ts";
import Sass from "../deps/sass.ts";
import { posix, toFileUrl } from "../deps/path.ts";
import { Page } from "../core/filesystem.ts";
import { prepareAsset, saveAsset } from "./source_maps.ts";
import textLoader from "../core/loaders/text.ts";

import type { Site } from "../core.ts";

type SassOptions = Omit<Sass.StringOptions<"async">, "url" | "syntax">;

export interface Options {
  /** Extensions processed by this plugin */
  extensions: string[];

  /** Output format */
  format: "compressed" | "expanded";

  /** SASS options */
  options: SassOptions;

  /** Custom includes paths */
  includes: string;
}

const defaults: Options = {
  extensions: [".scss", ".sass"],
  format: "compressed",
  options: {},
  includes: "",
};

/** A plugin to use SASS in Lume */
export default function (userOptions?: Partial<Options>) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    const includes = posix.join("/", options.includes || site.options.includes);

    site.loadAssets(options.extensions);
    site.process(options.extensions, sass);

    const { entries } = site.fs;
    const basePath = site.src();

    async function sass(page: Page) {
      const { content, filename, enableSourceMap } = prepareAsset(site, page);

      const sassOptions: Sass.StringOptions<"async"> = {
        ...options.options,
        sourceMap: enableSourceMap,
        style: options.format,
        syntax: page.src.ext === ".sass" ? "indented" : "scss",
        url: toFileUrl(filename),
        importer: {
          canonicalize(url: string) {
            let pathname = new URL(url).pathname;

            if (pathname.startsWith(basePath)) {
              pathname = normalizePath(pathname.slice(basePath.length));
            }

            // Relative path
            for (const path of getPathsToLook(pathname)) {
              const entry = entries.get(path);
              if (entry) {
                return toFileUrl(site.src(entry.path));
              }
            }

            // Import from includes
            for (const path of getPathsToLook(posix.join(includes, pathname))) {
              const entry = entries.get(path);
              if (entry) {
                return toFileUrl(site.src(entry.path));
              }
            }

            throw new Error(`File not be canonicalized: ${url} (${pathname})`);
          },
          async load(url: URL) {
            let pathname = url.pathname;

            if (pathname.startsWith(basePath)) {
              pathname = normalizePath(pathname.slice(basePath.length));
            }

            const entry = entries.get(pathname);

            if (entry) {
              const contents = (await entry.getContent(textLoader))
                .content as string;
              return {
                contents,
                syntax: pathname.endsWith(".sass") ? "indented" : "scss",
                sourceMapUrl: url,
              };
            }

            throw new Error(`File not found: ${url} (${pathname})`);
          },
        },
      };

      const output = await Sass.compileStringAsync(content, sassOptions);

      // @ts-ignore: sourceMap is not in the type definition
      saveAsset(site, page, output.css, output.sourceMap);
      page.data.url = replaceExtension(page.data.url, ".css");
    }
  };
}

function getPathsToLook(path: string): string[] {
  const basename = posix.basename(path);

  if (posix.extname(path)) {
    if (basename.startsWith("_")) {
      return [path];
    }
    return [path, posix.join(posix.dirname(path), `_${basename}`)];
  } else {
    if (basename.startsWith("_")) {
      return [
        `${path}.scss`,
        `${path}.sass`,
      ];
    }

    return [
      `${path}.scss`,
      `${path}.sass`,
      posix.join(posix.dirname(path), `_${basename}.scss`),
      posix.join(posix.dirname(path), `_${basename}.sass`),
    ];
  }
}
