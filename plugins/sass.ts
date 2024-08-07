import {
  normalizePath,
  replaceExtension,
  resolveInclude,
} from "../core/utils/path.ts";
import { merge } from "../core/utils/object.ts";
import { concurrent } from "../core/utils/concurrent.ts";
import { compileStringAsync } from "../deps/sass.ts";
import { fromFileUrl, posix, toFileUrl } from "../deps/path.ts";
import { Page } from "../core/file.ts";
import { prepareAsset, saveAsset } from "./source_maps.ts";
import textLoader from "../core/loaders/text.ts";

import type Site from "../core/site.ts";
import type { StringOptions } from "../deps/sass.ts";

type SassOptions = Omit<StringOptions<"async">, "url" | "syntax">;

export interface Options {
  /** Extensions processed by this plugin */
  extensions?: string[];

  /** Output format */
  format?: "compressed" | "expanded";

  /**
   * SASS options
   * @see https://sass-lang.com/documentation/js-api/interfaces/options/
   */
  options?: SassOptions;

  /**
   * Custom includes paths
   * @default `site.options.includes`
   */
  includes?: string;
}

export const defaults: Options = {
  extensions: [".scss", ".sass"],
  format: "compressed",
  options: {},
};

/**
 * A plugin to process SASS and SCSS files
 * @see https://lume.land/plugins/sass/
 */
export function sass(userOptions?: Options) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    // Ignore includes folder
    if (options.includes) {
      site.ignore(options.includes);
    }

    // Load & process the assets
    site.loadAssets(options.extensions);
    site.process(options.extensions, (pages) => concurrent(pages, sass));

    const { entries } = site.fs;
    const basePath = site.src();

    async function sass(page: Page) {
      const { content, filename, enableSourceMap } = prepareAsset(site, page);
      const baseFilename = posix.dirname(filename);

      const sassOptions: StringOptions<"async"> = {
        ...options.options,
        sourceMap: enableSourceMap,
        style: options.format,
        syntax: page.src.ext === ".sass" ? "indented" : "scss",
        url: toFileUrl(filename),
        importer: {
          canonicalize(url: string) {
            const pathname = normalizePath(fromFileUrl(url));
            const mainPath = pathname.startsWith(basePath)
              ? normalizePath(pathname.slice(basePath.length))
              : pathname;

            for (const path of getPathsToLook(mainPath)) {
              const entry = entries.get(path);

              if (entry) {
                return toFileUrl(site.src(entry.path));
              }
            }

            // Search in includes
            const includePath = pathname.startsWith(baseFilename)
              ? pathname.slice(baseFilename.length)
              : mainPath;

            for (const path of getPathsToLook(includePath)) {
              const resolved = resolveInclude(path, options.includes);
              const entry = entries.get(resolved);

              if (entry) {
                return toFileUrl(site.src(entry.path));
              }
            }

            throw new Error(
              `File cannot be canonicalized: ${url} (${pathname})`,
            );
          },
          async load(url: URL) {
            const pathname = fromFileUrl(url);
            const contents = await site.getContent(pathname, textLoader);

            if (typeof contents === "string") {
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

      const output = await compileStringAsync(content, sassOptions);

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
      posix.join(path, `index.scss`),
      posix.join(path, `index.sass`),
      posix.join(path, `_index.scss`),
      posix.join(path, `_index.sass`),
    ];
  }
}

export default sass;
