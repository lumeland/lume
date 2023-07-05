import { bundleAsync, transform } from "../deps/lightningcss.ts";
import { merge, resolveInclude } from "../core/utils.ts";
import textLoader from "../core/loaders/text.ts";
import { Page } from "../core/filesystem.ts";
import { prepareAsset, saveAsset } from "./source_maps.ts";
import { posix } from "../deps/path.ts";

import type { DeepPartial, Site } from "../core.ts";
import type {
  BundleAsyncOptions,
  CustomAtRules,
  TransformOptions,
} from "../deps/lightningcss.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Custom includes path */
  includes: string | false;

  /** Options passed to parcel_css */
  options: Omit<BundleAsyncOptions<CustomAtRules>, "filename">;
}

// Default options
export const defaults: Options = {
  extensions: [".css"],
  includes: false,
  options: {
    minify: true,
    drafts: {
      nesting: true,
      customMedia: true,
    },
    targets: {
      android: version(98),
      chrome: version(98),
      edge: version(98),
      firefox: version(97),
      ios_saf: version(15),
      safari: version(15),
      opera: version(83),
      samsung: version(16),
    },
  },
};

/** A plugin to load all CSS files and process them using parcelCSS */
export default function (userOptions?: DeepPartial<Options>) {
  return (site: Site) => {
    const options = merge<Options>(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    site.loadAssets(options.extensions);

    if (options.includes) {
      site.includes(options.extensions, options.includes);
      site.process(options.extensions, lightningCSSBundler);
    } else {
      site.process(options.extensions, lightningCSSTransformer);
    }

    function lightningCSSTransformer(file: Page) {
      const { content, filename, sourceMap, enableSourceMap } = prepareAsset(
        site,
        file,
      );

      // Process the code with parcelCSS
      const code = new TextEncoder().encode(content);
      const transformOptions: TransformOptions<CustomAtRules> = {
        filename,
        // @ts-expect-error: the lightningcss type definitions expect a node Buffer: https://github.com/parcel-bundler/lightningcss/pull/530
        code,
        sourceMap: enableSourceMap,
        inputSourceMap: JSON.stringify(sourceMap),
        ...options.options,
      };

      const result = transform(transformOptions);
      const decoder = new TextDecoder();

      saveAsset(
        site,
        file,
        decoder.decode(result.code),
        enableSourceMap ? decoder.decode(result.map!) : undefined,
      );
    }

    async function lightningCSSBundler(file: Page) {
      const { content, filename, sourceMap, enableSourceMap } = prepareAsset(
        site,
        file,
      );

      const { formats } = site;
      const { includes } = site.options;

      // Process the code with lightningCSS
      const bundleOptions: BundleAsyncOptions<CustomAtRules> = {
        filename,
        sourceMap: enableSourceMap,
        inputSourceMap: JSON.stringify(sourceMap),
        ...options.options,
        resolver: {
          resolve(id: string, from: string) {
            const format = formats.search(id);
            const includesPath = format?.includesPath ?? includes;

            return resolveInclude(id, includesPath, posix.dirname(from));
          },
          async read(file: string) {
            if (file === filename) {
              return content;
            }

            return await site.getContent(file, textLoader) as string;
          },
        },
      };

      const result = await bundleAsync(bundleOptions);
      const decoder = new TextDecoder();

      saveAsset(
        site,
        file,
        decoder.decode(result.code),
        enableSourceMap ? decoder.decode(result.map!) : undefined,
      );
    }
  };
}

/**
 * Convert a version number to a single 24-bit number
 */
export function version(major: number, minor = 0, patch = 0): number {
  return (major << 16) | (minor << 8) | patch;
}
