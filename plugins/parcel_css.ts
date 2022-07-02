import init, { transform } from "../deps/parcel_css.ts";
import { merge } from "../core/utils.ts";
import { Page } from "../core/filesystem.ts";
import { basename } from "../deps/path.ts";

import type { Site } from "../core.ts";
import type { TransformOptions } from "../deps/parcel_css.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  sourceMap: boolean;

  /** Options passed to parcel_css */
  options: Omit<TransformOptions, "filename" | "code">;
}

// Default options
export const defaults: Options = {
  extensions: [".css"],
  sourceMap: false,
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
export default function (userOptions?: Partial<Options>) {
  return (site: Site) => {
    const options = merge(defaults, userOptions);

    site.loadAssets(options.extensions);
    site.process(options.extensions, parcelCSS);

    function parcelCSS(file: Page) {
      const from = site.src(file.src.path + file.src.ext);

      if (options.sourceMap) {
        options.options.sourceMap = options.sourceMap;
      }

      // Process the code with parcelCSS
      const content = typeof file.content === "string"
        ? new TextEncoder().encode(file.content)
        : file.content as Uint8Array;

      const transformOptions: TransformOptions = {
        filename: from,
        code: content,
        ...options.options,
      };

      const result = transform(transformOptions);
      const decoder = new TextDecoder();

      file.content = decoder.decode(result.code);

      if (result.map) {
        const mapFile = Page.create(
          file.dest.path + ".css.map",
          decoder.decode(result.map),
        );
        site.pages.push(mapFile);
        file.content += `\n/*# sourceMappingURL=./${
          basename(file.dest.path)
        }.css.map */`;
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
