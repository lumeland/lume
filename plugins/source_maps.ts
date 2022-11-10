import { isUrl, merge, normalizePath, read } from "../core/utils.ts";
import { encode } from "../deps/base64.ts";
import { Page } from "../core/filesystem.ts";
import { basename, join, toFileUrl } from "../deps/path.ts";

import type { Site } from "../core.ts";

export interface Options {
  /** Set true to inline the source map in the output file */
  inline: boolean;

  /** Set true to include the content of the source files */
  sourceContent: boolean;
}

export const defaults: Options = {
  inline: false,
  sourceContent: false,
};

/** Generate the source map files of assets */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site._data.enableSourceMap = true;

    site.process("*", async (file: Page, files: Page[]) => {
      const sourceMap = file.data.sourceMap as SourceMap | undefined;
      file.data.sourceMap = undefined;

      if (!sourceMap) {
        return;
      }

      // Add the content of the source files
      try {
        if (options.sourceContent) {
          sourceMap.sourcesContent = await Promise.all(
            sourceMap.sources.map((url: string) => {
              const content = sourceMap[dynamicSourcesSymbol]?.[url];

              return content ? content : read(url, false);
            }),
          );
        }
      } catch (err) {
        console.error(err, sourceMap.sources);
      }

      // Relative paths (eg. "../bar") look better in the dev-tools.
      sourceMap.sourceRoot = toFileUrl(site.root()).href;
      sourceMap.sources = sourceMap.sources.map((url: string) =>
        url.replace(sourceMap.sourceRoot!, "")
      );

      // Inline the source map in the output file
      if (options.inline) {
        const url = `data:application/json;charset=utf-8;base64,${
          encode(JSON.stringify(sourceMap))
        }`;
        file.content += `\n/*# sourceMappingURL=${url} */`;
        return;
      }

      // Create a source map file
      const url = file.outputPath + ".map";
      sourceMap.file = url;
      file.content += `\n/*# sourceMappingURL=./${basename(url)} */`;
      files.push(Page.create(url, JSON.stringify(sourceMap)));
    });
  };
}

/** Utilities to use by other plugins to manage source maps */
export const dynamicSourcesSymbol = Symbol.for("dynamicSources");

/** SourceMap with a property to store dynamic sources */
export interface SourceMap {
  version: number;
  file?: string;
  sources: string[];
  sourceRoot?: string;
  sourcesContent?: string[];
  names: string[];
  mappings: string;
  [dynamicSourcesSymbol]?: Record<string, string>;
}

export interface PrepareResult {
  content: string;
  sourceMap?: SourceMap;
  filename: string;
  enableSourceMap: boolean;
}

/** Return the required info to process a file */
export function prepareAsset(site: Site, page: Page): PrepareResult {
  const enableSourceMap = !!site._data.enableSourceMap;
  const content = page.content as string;
  const sourceMap = enableSourceMap
    ? page.data.sourceMap as SourceMap | undefined
    : undefined;
  const filename = page.src.path
    ? site.src(page.src.path + page.src.ext)
    : site.src(page.outputPath);
  return { content, sourceMap, filename, enableSourceMap };
}

/** Save the process result */
export function saveAsset(
  site: Site,
  page: Page,
  content: string,
  sourceMap?: SourceMap | string,
) {
  if (!site._data.enableSourceMap) {
    sourceMap = undefined;
  }

  // There's no source map
  if (!sourceMap) {
    page.content = content;
    return;
  }

  const root = site.root();

  // Ensure the sourceMap is an object
  if (typeof sourceMap === "string") {
    sourceMap = JSON.parse(sourceMap) as SourceMap;
  }

  // Normalize any source url
  function normalizeSource(source: string): string {
    if (source.startsWith("deno:")) { // esbuild
      source = source.substring(5);
    }
    if (isUrl(source)) {
      return source;
    }

    source = normalizePath(source);

    return source.startsWith(root)
      ? toFileUrl(source).href
      : toFileUrl(join(root, source)).href;
  }

  sourceMap.sources = sourceMap.sources.map(normalizeSource);

  // Inherit the dynamic sources from the previous source map
  const previousSourceMap = page.data.sourceMap as SourceMap | undefined;
  if (previousSourceMap) {
    sourceMap[dynamicSourcesSymbol] = previousSourceMap[dynamicSourcesSymbol];
  }

  // If it's a dynamic source (not from the file system), store it in the source map
  if (!page.src.path) {
    const sources = sourceMap[dynamicSourcesSymbol] || {};
    const file = normalizeSource(site.src(page.outputPath));
    sourceMap[dynamicSourcesSymbol] = sources;

    if (!sources[file]) {
      sources[file] = page.content as string;
    }
  }

  // Store the new content and source map
  page.data.sourceMap = sourceMap;
  page.content = content;
}
