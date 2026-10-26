import { merge } from "@lumeland/core/utils/object.ts";
import { concurrent } from "@lumeland/core/utils/concurrent.ts";
import { compileStringAsync } from "../deps/sass.ts";
import { fromFileUrl, posix, toFileUrl } from "../deps/path.ts";
import { Page } from "@lumeland/core/file.ts";
import { prepareAsset, saveAsset } from "@lumeland/plugin-source-maps";
import { warnUntil } from "@lumeland/core/utils/log.ts";

import type Site from "@lumeland/core/site.ts";
import type { StringOptions } from "../deps/sass.ts";
import Path from "@lumeland/core/path.ts";

type SassOptions = Omit<StringOptions<"async">, "url" | "syntax">;

export interface Options {
  /** Output format */
  format?: "compressed" | "expanded";

  /**
   * SASS options
   * @see https://sass-lang.com/documentation/js-api/interfaces/options/
   */
  options?: SassOptions;
}

export const defaults = {
  format: "compressed",
  options: {},
} satisfies Options;

/**
 * A plugin to process SASS and SCSS files
 * @see https://lume.land/plugins/sass/
 */
export function sass(userOptions?: Options) {
  return (site: Site) => {
    const options = merge(defaults, userOptions);

    site.process([".scss", ".sass"], function processSASS(files: Page[]) {
      const hasPages = warnUntil(
        "[sass plugin] No SCSS or SASS files found. Make sure to add them with <code>site.add()</code>",
        files.length,
      );

      if (!hasPages) {
        return;
      }

      return concurrent(files, sass);
    });

    const { entries } = site.fs;
    const basePath = Path.create(site.src());

    async function sass(page: Page) {
      const { content, filename, enableSourceMap } = prepareAsset(site, page);
      const assetPath = Path.create(filename);
      const baseFilename = assetPath.dirname;

      const sassOptions: StringOptions<"async"> = {
        ...options.options,
        sourceMap: enableSourceMap,
        style: options.format,
        syntax: page.src.ext === ".sass" ? "indented" : "scss",
        url: assetPath.url,
        importer: {
          canonicalize(url: string) {
            const pathname = Path.create(url);
            const mainPath = pathname.clone().removeBase(basePath).toString();

            for (const path of getPathsToLook(mainPath)) {
              const entry = entries.get(path);

              if (entry) {
                return toFileUrl(site.src(entry.path));
              }
            }

            // Search in includes
            const includePath = pathname.contains(baseFilename)
              ? pathname.removeBase(baseFilename)
              : mainPath;

            for (const path of getPathsToLook(includePath.toString())) {
              const resolved = resolveInclude(path);
              const entry = entries.get(resolved);

              if (entry) {
                return toFileUrl(site.src(entry.path));
              }
            }

            return null;
          },
          async load(url: URL) {
            const pathname = fromFileUrl(url);
            const contents = await site.getContent(pathname, false);

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
      const url = Path.create(page.data.url);
      url.extension = ".css";
      page.data.url = url.toString();
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
      return [`${path}.scss`, `${path}.sass`];
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

function resolveInclude(path: string): string {
  const includes = Path.create("/_includes");
  const normalized = Path.create(path);
  return normalized.belongsTo(includes)
    ? normalized.toString()
    : includes.join(normalized.toString()).toString();
}
