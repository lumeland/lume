import { merge } from "@lumeland/core/utils/object.ts";
import { readFile } from "@lumeland/core/utils/read.ts";
import { Page } from "@lumeland/core/file.ts";
import { warnUntil } from "@lumeland/core/utils/log.ts";
import { bytes } from "@lumeland/core/utils/format.ts";
import { log } from "@lumeland/core/utils/log.ts";
import { browsers, version } from "@lumeland/core/utils/browsers.ts";
import { getFile, isFromCdn } from "@lumeland/core/utils/cdn.ts";
import { prepareAsset, saveAsset } from "@lumeland/plugin-source-maps";
import { bundleAsync, transform } from "../deps/lightningcss.ts";
import Path from "@lumeland/core/path.ts";

import type { Item } from "@lumeland/core/debugbar.ts";
import type Site from "@lumeland/core/site.ts";
import type {
  BundleAsyncOptions,
  CustomAtRules,
  TransformOptions,
  TransformResult,
} from "../deps/lightningcss.ts";
import { getInclude } from "@lumeland/core/utils/includes.ts";

export interface Options {
  /** Bundle the CSS or only transform it */
  bundle?: boolean;

  /** Options passed to Lightningcss */
  options?: Omit<BundleAsyncOptions<CustomAtRules>, "filename">;
}

// Default options
export const defaults = {
  bundle: true,
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
} satisfies Options;

/**
 * A plugin to process CSS files with lightningcss
 * @see https://lume.land/plugins/lightningcss/
 */
export function lightningCSS(userOptions?: Options) {
  return (site: Site) => {
    const options = merge(defaults, userOptions);

    site.process([".css"], function processLightningCSS(files: Page[]) {
      const hasPages = warnUntil(
        '[lightningcss plugin] No CSS files found. Make sure to add the CSS files with <code>site.add()</code>. For example: <code>site.add("style.css")</code>',
        files.length,
      );

      if (!hasPages) {
        return;
      }

      const item = site.debugBar?.buildItem("[lightningcss plugin] CSS processing completed");

      if (options.bundle) {
        return lightningCSSBundler(files, item);
      }

      files.forEach((file) => lightningCSSTransformer(file, item));
    });

    function lightningCSSTransformer(file: Page, item?: Item) {
      const { content, filename, sourceMap, enableSourceMap } = prepareAsset(site, file);

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
        const error = err as any;
        const message = showError(content, error.loc.column, error.loc.line);
        log.error(`[lightningcss plugin] Error processing ${file.data.url}:\n${message}`);
        return;
      }

      const decoder = new TextDecoder();

      if (item) {
        item.items ??= [];
        item.items.push({
          title: file.data.url,
          details: bytes(result.code.length),
          items: result.warnings.map((warning) => ({
            title: `[${warning.type}] ${warning.message}`,
            text: warning.loc.filename,
            context: "warning",
          })),
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
        const { content, filename, sourceMap, enableSourceMap } = prepareAsset(site, file);
        const root = site.src();

        // Process the code with lightningCSS
        const bundleOptions: BundleAsyncOptions<CustomAtRules> = {
          filename,
          sourceMap: enableSourceMap,
          inputSourceMap: JSON.stringify(sourceMap),
          ...options.options,
          resolver: {
            resolve(id: string, rawFrom: string) {
              if (isFromCdn(id)) {
                return getFile(id);
              }

              if (id.startsWith("http")) {
                return id;
              }

              const from = Path.create(rawFrom).removeBase(root);

              const entry = getInclude(from.dirname, id, site.fs);

              if (!entry) {
                log.error(`[lightningcss plugin] Included file ${id} from ${rawFrom} not found`);
                return "";
              }

              return entry.path;
            },
            async read(file: string) {
              if (file === filename) {
                return content;
              }

              if (file.startsWith("http")) {
                return readFile(file);
              }

              const code = await site.getContent(file, false);
              if (code === undefined) {
                log.error(`[lightningcss plugin] File ${file} not found`);
              }
              return code ?? "";
            },
          },
        };

        let result: TransformResult;

        try {
          result = await bundleAsync(bundleOptions);
        } catch (err) {
          const error = err as any;
          const code = (await site.getContent(error.fileName, false)) as string;

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
            items: result.warnings.map((warning) => ({
              title: `[${warning.type}] ${warning.message}`,
              text: warning.loc.filename,
              context: "warning",
            })),
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
