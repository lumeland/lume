import {
  compile,
  Scanner,
  specifier,
  toSourceMap,
} from "../deps/tailwindcss.ts";
import { merge } from "../core/utils/object.ts";
import { log, warnUntil } from "../core/utils/log.ts";
import { dirname } from "../deps/path.ts";
import { readFile } from "../core/utils/read.ts";
import { resolveInclude } from "../core/utils/path.ts";
import { prepareAsset, saveAsset } from "./source_maps.ts";
import { Features, transform } from "../deps/lightningcss.ts";
import { getFile, isFromCdn } from "../core/utils/cdn.ts";

import type { ChangedContent } from "../deps/tailwindcss.ts";
import type Site from "../core/site.ts";

export interface Options {
  /**
   * Custom includes path
   * @default `site.options.includes`
   */
  includes?: string | false;

  /** To enable minified output */
  minify?: boolean;
}

export const defaults: Options = {};

/**
 * A plugin to extract the utility classes from HTML pages and apply TailwindCSS
 * @see https://lume.land/plugins/tailwindcss/
 */
export function tailwindCSS(userOptions?: Options) {
  return (site: Site) => {
    const options = merge<Options>(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );
    const scanner = new Scanner({});
    const candidates: string[] = [];
    let content: ChangedContent[] = [];

    site.process([".html", ".js"], function processTailwindContent(pages) {
      for (const page of pages) {
        const file = page.outputPath;
        content.push({
          content: page.text,
          extension: file.endsWith(".html") ? ".html" : ".js",
        });
      }
    });

    site.process([".css"], async function processTailwindCSS(files) {
      const hasPages = warnUntil(
        "[tailwindcss plugin] No CSS files found. Make sure to add the CSS files with <code>site.add()</code>",
        files.length,
      );

      if (!hasPages) {
        return;
      }

      candidates.push(...scanner.scanFiles(content));
      content = [];

      for (const file of files) {
        const { content, filename, enableSourceMap } = prepareAsset(
          site,
          file,
        );
        const compiler = await compile(content, {
          from: filename,
          async loadModule(id, base, resourceHint) {
            if (id.startsWith(".")) {
              id = site.src(base, id);
              const mod = await import(id);
              return {
                base,
                path: id,
                module: mod.default,
              };
            }
            if (resourceHint === "plugin") {
              const mod = await import(`npm:${id}`);
              return {
                base,
                path: id,
                module: mod.default,
              };
            }
            log.fatal(`[tailwindcss plugin] Cannot resolve module '${id}'`);
            throw new Error(`Cannot resolve module '${id}'`);
          },
          async loadStylesheet(id, base) {
            if (id === "tailwindcss") {
              const path = `${specifier}/index.css`;
              const content = await readFile(path);
              return { content, path, base };
            }

            if (id.startsWith("tailwindcss/")) {
              const filename = id.replace("tailwindcss/", "");
              const path = `${specifier}/${filename}`;
              const content = await readFile(path);
              return { content, path, base };
            }

            if (options.includes === false) {
              if (!id.startsWith(".")) {
                log.fatal(`[tailwindcss plugin] Cannot resolve module '${id}'`);
                throw new Error(`Cannot resolve module '${id}'`);
              }
            }

            // Support npm: prefix to load from npm CDN (ex: npm:tw-animate-css)
            if (isFromCdn(id)) {
              id = getFile(id);
              const content = await readFile(id);
              return { content, path: id, base };
            }

            // If the path is relative, and no base is provided, use the CSS file location as base
            if (!base && id.startsWith(".")) {
              base = dirname(filename);
            }

            const path = resolveInclude(id, options.includes || "", base);
            const content = await site.getContent(path, false);

            if (content === undefined) {
              log.fatal(`[tailwindcss plugin] File ${path} not found`);
              throw new Error(`File ${path} not found`);
            }

            return { content, path, base: dirname(path) };
          },
        });

        const code = compiler.build(candidates);
        if (enableSourceMap) {
          const map = toSourceMap(compiler.buildSourceMap()).raw;

          if (options.minify) {
            const result = optimize(filename, code, map);
            saveAsset(
              site,
              file,
              result.code,
              result.map,
            );
          } else {
            saveAsset(site, file, code, map);
          }
        } else {
          if (options.minify) {
            file.text = optimize(filename, code).code;
          } else {
            file.text = code;
          }
        }
      }
    });
  };
}

export default tailwindCSS;

// https://github.com/tailwindlabs/tailwindcss/blob/191195af7e77234b3a5278c45d9df3eb3395cef7/packages/%40tailwindcss-node/src/optimize.ts#L29-L56
interface OptimizeResult {
  code: string;
  map?: string;
}
function optimize(filename: string, code: string, map?: string) {
  try {
    const result = transform({
      filename,
      code: new TextEncoder().encode(code),
      minify: true,
      sourceMap: typeof map !== "undefined",
      inputSourceMap: map,
      drafts: {
        customMedia: true,
      },
      nonStandard: {
        deepSelectorCombinator: true,
      },
      include: Features.Nesting | Features.MediaQueries,
      exclude: Features.LogicalProperties | Features.DirSelector |
        Features.LightDark,
      targets: {
        safari: (16 << 16) | (4 << 8),
        ios_saf: (16 << 16) | (4 << 8),
        firefox: 128 << 16,
        chrome: 111 << 16,
      },
      errorRecovery: true,
    });

    const decoder = new TextDecoder();

    return {
      code: decoder.decode(result.code),
      map: result.map ? decoder.decode(result.map) : undefined,
    };
  } catch (err) {
    // deno-lint-ignore no-explicit-any
    const error = err as any;
    const message = showError(code, error.loc.column, error.loc.line);
    log.error(
      `[tailwindcss plugin] Error processing ${filename}:\n${message}`,
    );
    return { code, map };
  }
}

function showError(code: string, column: number, line: number) {
  const lines = code.split("\n");
  const errorLine = lines[line - 1];
  const errorColumn = " ".repeat(column - 1) + "^";
  return `Error at line ${line}, column ${column}:\n${errorLine}\n${errorColumn}`;
}
