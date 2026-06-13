import { isUrl, normalizePath } from "../core/utils/path.ts";
import { merge } from "../core/utils/object.ts";
import { log } from "../core/utils/log.ts";
import { read } from "../core/utils/read.ts";
import { concurrent } from "../core/utils/concurrent.ts";
import { Data, DataIn, Page } from "../core/file.ts";
import { basename, join, toFileUrl } from "../deps/path.ts";

import type Site from "../core/site.ts";

export interface SourceMapsPluginData extends Data {
  /**
   * The source map data (if it's an asset)
   * @see https://lume.land/plugins/source_maps/
   */
  sourceMap?: SourceMap;
}

export interface Options {
  /** Set true to inline the source map in the output file */
  inline?: boolean;

  /** Set false to don't include the content of the source files */
  sourceContent?: boolean;
}

export const defaults = {
  inline: false,
  sourceContent: true,
} satisfies Options;

/**
 * A plugin to manage source maps
 * @see https://lume.land/plugins/source_maps/
 */
export function sourceMaps(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return <D extends SourceMapsPluginData>(site: Site<D>) => {
    site._data.enableSourceMap = true;

    site.process(function processSourceMaps(pages, allPages) {
      return concurrent(pages, (page) => processSourceMap(page, allPages));
    });

    async function processSourceMap(file: Page<D>, files: Page<DataIn>[]) {
      const sourceMap = file.data.sourceMap;
      file.data.sourceMap = undefined;

      if (!sourceMap) {
        return;
      }

      // Add the content of the source files
      try {
        if (options.sourceContent) {
          const sourcesContent = sourceMap.sourcesContent || [];
          sourceMap.sourcesContent = await Promise.all(
            sourceMap.sources.map((url: string, index: number) => {
              const content = sourcesContent[index] ??
                sourceMap[dynamicSourcesSymbol]?.[url];

              return content ? content : read(url, false);
            }),
          );
        } else {
          sourceMap.sourcesContent = undefined;
        }
      } catch (err) {
        log.error(`[source_maps plugin] ${(err as Error).message}`, [
          ...sourceMap.sources,
        ]);
      }

      // Relative paths (eg. "../bar") look better in the dev-tools.
      sourceMap.sourceRoot = toFileUrl(site.root()).href;
      sourceMap.sources = sourceMap.sources.map((url: string) =>
        url.replace(sourceMap.sourceRoot!, "")
      );

      // Inline the source map in the output file
      if (options.inline) {
        const base64 = new TextEncoder().encode(JSON.stringify(sourceMap))
          .toBase64();
        const url = `data:application/json;charset=utf-8;base64,${base64}`;
        file.content += addSourceMap(file.outputPath, url);
        return;
      }

      // Create a source map file
      const url = file.outputPath + ".map";
      sourceMap.file = url;
      file.content += addSourceMap(file.outputPath, `./${basename(url)}`);
      files.push(Page.create({ url, content: JSON.stringify(sourceMap) }));
    }
  };
}

/** Utilities to use by other plugins to manage source maps */
export const dynamicSourcesSymbol = Symbol.for("dynamicSources");

/** SourceMap with a property to store dynamic sources */
export interface SourceMap {
  version: number;
  file?: string;
  sources: readonly string[];
  sourceRoot?: string;
  sourcesContent?: readonly (string | null)[];
  names: readonly string[];
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
export function prepareAsset<D extends SourceMapsPluginData>(
  site: Site<D>,
  page: Page<D>,
): PrepareResult {
  const enableSourceMap = !!site._data.enableSourceMap;
  const content = page.text;
  const sourceMap = enableSourceMap ? page.data.sourceMap : undefined;
  const filename = page.src.path
    ? site.src(page.sourcePath)
    : site.src(page.outputPath);
  return { content, sourceMap, filename, enableSourceMap };
}

/** Save the process result */
export function saveAsset<D extends SourceMapsPluginData>(
  site: Site<D>,
  page: Page<D>,
  content: string,
  sourceMap?: SourceMap | string,
) {
  if (!site._data.enableSourceMap) {
    sourceMap = undefined;
  }

  // There's no source map
  if (!sourceMap) {
    page.text = content;
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
      ? toFileUrl(decodeURIComponent(source)).href
      : toFileUrl(decodeURIComponent(join(root, source))).href;
  }

  sourceMap.sources = sourceMap.sources
    .filter((source: string) => source !== "<no source>") // tailwindcss
    .map(normalizeSource);

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
      sources[file] = page.text;
    }
  }

  // Store the new content and source map
  page.data.sourceMap = sourceMap;
  page.text = content;
}

function addSourceMap(url: string, sourceMap: string): string {
  if (url.endsWith(".js")) {
    return `\n//# sourceMappingURL=${sourceMap}`;
  }

  // It's CSS
  return `\n/*# sourceMappingURL=${sourceMap} */`;
}

export default sourceMaps;

/** Extends Data interface */
declare global {
  namespace Lume {
    export interface Data extends SourceMapsPluginData {}
  }
}
