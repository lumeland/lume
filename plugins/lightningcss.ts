import { bundleAsync, transform } from "../deps/lightningcss.ts";
import { resolveInclude } from "../core/utils/path.ts";
import { merge } from "../core/utils/object.ts";
import { readFile } from "../core/utils/read.ts";
import { Page } from "../core/file.ts";
import { prepareAsset, saveAsset } from "./source_maps.ts";
import { posix } from "../deps/path.ts";
import { warnUntil } from "../core/utils/log.ts";
import { bytes } from "../core/utils/format.ts";

import type { Item } from "../deps/debugbar.ts";
import type Site from "../core/site.ts";
import type {
  BundleAsyncOptions,
  CustomAtRules,
  TransformOptions,
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
      android: version(100),
      chrome: version(100),
      edge: version(100),
      firefox: version(100),
      ios_saf: version(16),
      safari: version(16),
      opera: version(100),
      samsung: version(19),
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

    site.process([".css"], lightningCSSProcessor);

    function lightningCSSProcessor(files: Page[]) {
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
    }

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

      const result = transform(transformOptions);
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

        const result = await bundleAsync(bundleOptions);
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

/**
 * Convert a version number to a single 24-bit number
 */
export function version(major: number, minor = 0, patch = 0): number {
  return (major << 16) | (minor << 8) | patch;
}

export default lightningCSS;
