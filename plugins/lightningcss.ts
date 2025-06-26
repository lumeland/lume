import { bundleAsync, transform } from "../deps/lightningcss.ts";
import { resolveInclude } from "../core/utils/path.ts";
import { merge } from "../core/utils/object.ts";
import { readFile } from "../core/utils/read.ts";
import { Page } from "../core/file.ts";
import { prepareAsset, saveAsset } from "./source_maps.ts";
import { posix } from "../deps/path.ts";
import { warnUntil } from "../core/utils/log.ts";
import { bytes } from "../core/utils/format.ts";
import { log } from "../core/utils/log.ts";
import { browsers, version } from "../core/utils/browsers.ts";

import type { Item } from "../deps/debugbar.ts";
import type Site from "../core/site.ts";
import type {
  BundleAsyncOptions,
  CustomAtRules,
  TransformOptions,
  TransformResult,
} from "../deps/lightningcss.ts";

export interface Options {
  /**
   * Custom includes path
   * @default `site.options.includes`
   */
  includes?: string | false;

  /** Options passed to Lightningcss */
  options?: Omit<BundleAsyncOptions<CustomAtRules>, "filename">;
}

// Default options
export const defaults: Options = {
  includes: "",
  options: {
    minify: true,
    drafts: {
      customMedia: true,
    },
    targets: {
      android: version(browsers.chrome_android),
      chrome: version(browsers.chrome),
      edge: version(browsers.edge),
      firefox: version(browsers.firefox),
      ios_saf: version(browsers.safari_ios),
      safari: version(browsers.safari),
    },
  },
};

/**
 * A plugin to process CSS files with lightningcss
 * @see https://lume.land/plugins/lightningcss/
 */
export function lightningCSS(userOptions?: Options) {
  return (site: Site) => {
    const options = merge<Options>(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    let bundle = false;
    if (options.includes) {
      site.ignore(options.includes);
      bundle = true;
    }

    site.process([".css"], function processLightningCSS(files: Page[]) {
      const hasPages = warnUntil(
        "[lightningcss plugin] No CSS files found. Make sure to add the CSS files with <code>site.add()</code>",
        files.length,
      );

      if (!hasPages) {
        return;
      }

      const item = site.debugBar?.buildItem(
        "[lightningcss plugin] CSS processing completed",
      );

      if (bundle) {
        return lightningCSSBundler(files, item);
      }

      files.forEach((file) => lightningCSSTransformer(file, item));
    });

    function lightningCSSTransformer(file: Page, item?: Item) {
      const { content, filename, sourceMap, enableSourceMap } = prepareAsset(
        site,
        file,
      );

      // Process the code with parcelCSS
      const code = new TextEncoder().encode(content);
      const transformOptions: TransformOptions<CustomAtRules> = {
        filename,
        code,
        sourceMap: enableSourceMap,
        inputSourceMap: JSON.stringify(sourceMap),
        ...options.options,
      };

      let result: TransformResult;

      try {
        result = transform(transformOptions);
      } catch (err) {
        // deno-lint-ignore no-explicit-any
        const error = err as any;
        const message = showError(content, error.loc.column, error.loc.line);
        log.error(
          `[lightningcss plugin] Error processing ${file.data.url}:\n${message}`,
        );
        return;
      }

      const decoder = new TextDecoder();

      if (item) {
        item.items ??= [];
        item.items.push({
          title: file.data.url,
          details: bytes(result.code.length),
          items: [
            ...result.warnings.map((warning) => ({
              title: `[${warning.type}] ${warning.message}`,
              text: warning.loc.filename,
              context: "warning",
            })),
          ],
        });
      }

      saveAsset(
        site,
        file,
        decoder.decode(result.code),
        enableSourceMap ? decoder.decode(result.map!) : undefined,
      );
    }

    /**
     * Bundles all CSS files into a single file
     * This cannot be done in parallel because ligthningcss has a bug that mixes the imports of all files
     * Seems like executing the bundler in sequence fixes the issue
     */
    async function lightningCSSBundler(files: Page[], item?: Item) {
      for (const file of files) {
        const { content, filename, sourceMap, enableSourceMap } = prepareAsset(
          site,
          file,
        );

        const includes = options.includes as string;

        // Process the code with lightningCSS
        const bundleOptions: BundleAsyncOptions<CustomAtRules> = {
          filename,
          sourceMap: enableSourceMap,
          inputSourceMap: JSON.stringify(sourceMap),
          ...options.options,
          resolver: {
            resolve(id: string, from: string) {
              if (id.startsWith("npm:")) {
                return id.replace("npm:", "https://cdn.jsdelivr.net/npm/");
              }
              return resolveInclude(id, includes, posix.dirname(from));
            },
            async read(file: string) {
              if (file === filename) {
                return content;
              }

              if (file.startsWith("http")) {
                return readFile(file);
              }

              return await site.getContent(file, false) as string;
            },
          },
        };

        let result: TransformResult;

        try {
          result = await bundleAsync(bundleOptions);
        } catch (err) {
          // deno-lint-ignore no-explicit-any
          const error = err as any;
          const code = await site.getContent(error.fileName, false) as string;

          if (code) {
            const message = showError(code, error.loc.column, error.loc.line);
            log.error(
              `[lightningcss plugin] Error processing <code>${file.data.url}</code>\n${message}`,
            );
            return;
          }
          throw err;
        }

        const decoder = new TextDecoder();

        if (item) {
          item.items ??= [];
          item.items.push({
            title: file.data.url,
            details: bytes(result.code.length),
            items: [
              ...result.warnings.map((warning) => ({
                title: `[${warning.type}] ${warning.message}`,
                text: warning.loc.filename,
                context: "warning",
              })),
            ],
          });
        }

        saveAsset(
          site,
          file,
          decoder.decode(result.code),
          enableSourceMap ? decoder.decode(result.map!) : undefined,
        );
      }
    }
  };
}

export default lightningCSS;

function showError(code: string, column: number, line: number) {
  const lines = code.split("\n");
  const errorLine = lines[line - 1];
  const errorColumn = " ".repeat(column - 1) + "^";
  return `Error at line ${line}, column ${column}:\n${errorLine}\n${errorColumn}`;
}
