import { compile, Scanner, toSourceMap } from "../deps/tailwindcss.ts";
import { merge } from "@lumeland/core/utils/object.ts";
import { log, warnUntil } from "@lumeland/core/utils/log.ts";
import { prepareAsset, saveAsset } from "@lumeland/plugin-source-maps";
import { Features, transform } from "../deps/lightningcss.ts";

import type { ChangedContent } from "../deps/tailwindcss.ts";
import type Site from "@lumeland/core/site.ts";

export interface Options {
  /**
   * Custom includes path
   * @default `site.options.includes`
   */
  includes?: string | false;

  /** To enable minified output */
  minify?: boolean;
}

export const defaults = {} satisfies Options;

/**
 * A plugin to extract the utility classes from HTML pages and apply TailwindCSS
 * @see https://lume.land/plugins/tailwindcss/
 */
export function tailwindCSS(userOptions?: Options) {
  return (site: Site) => {
    const options = merge({ ...defaults, includes: site.options.includes }, userOptions);
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
        const { content, filename, enableSourceMap } = prepareAsset(site, file);
        const compiler = await compile(content, {
          base: site.src(),
          onDependency(path) {
            console.log("Tailwind dependency:", path);
          },
        });

        const code = compiler.build(candidates);

        if (enableSourceMap) {
          const map = toSourceMap(compiler.buildSourceMap()).raw;

          if (options.minify) {
            const result = optimize(filename, code, map);
            saveAsset(site, file, result.code, result.map);
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
      exclude: Features.LogicalProperties | Features.DirSelector | Features.LightDark,
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
    log.error(`[tailwindcss plugin] Error processing ${filename}:\n${message}`);
    return { code, map };
  }
}

function showError(code: string, column: number, line: number) {
  const lines = code.split("\n");
  const errorLine = lines[line - 1];
  const errorColumn = " ".repeat(column - 1) + "^";
  return `Error at line ${line}, column ${column}:\n${errorLine}\n${errorColumn}`;
}
