import init, { transform } from "../deps/lightningcss.ts";
import { merge } from "../core/utils.ts";
import { Page } from "../core/filesystem.ts";
import { prepareAsset, saveAsset } from "./source_maps.ts";

import type { DeepPartial, Site } from "../core.ts";
import type { TransformOptions } from "../deps/lightningcss.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Options passed to parcel_css */
  options: Omit<TransformOptions, "filename" | "code">;
}

// Default options
export const defaults: Options = {
  extensions: [".css"],
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

// Init parcelCSS
await init();

/** A plugin to load all CSS files and process them using parcelCSS */
export default function (userOptions?: DeepPartial<Options>) {
  return (site: Site) => {
    const options = merge(defaults, userOptions);

    site.loadAssets(options.extensions);
    site.process(options.extensions, parcelCSS);

    function parcelCSS(file: Page) {
      const { content, filename, sourceMap, enableSourceMap } = prepareAsset(
        site,
        file,
      );

      // Process the code with parcelCSS
      const code = new TextEncoder().encode(content);
      const transformOptions: TransformOptions = {
        filename,
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
        enableSourceMap ? decoder.decode(result.map) : undefined,
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
