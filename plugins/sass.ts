import { merge } from "../core/utils.ts";
import { SassFormats, SassOptions, str } from "../deps/denosass.ts";
import { posix } from "../deps/path.ts";

import type { Page, Site } from "../core.ts";

export interface Options {
  /** Extensions processed by this plugin */
  extensions: string[];

  /** Output format */
  format: SassFormats;

  /** Custom includes paths */
  includes: string | string[];
}

const defaults: Options = {
  extensions: [".scss"],
  format: "compressed",
  includes: [],
};

/** A plugin to use SASS in Lume */
export default function (userOptions?: Partial<Options>) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    const includes = Array.isArray(options.includes)
      ? options.includes.map((path) => site.src(path))
      : [site.src(options.includes)];

    site.loadAssets(options.extensions);
    site.process(options.extensions, sass);

    function sass(page: Page) {
      const code = page.content as string;
      const filename = site.src(page.src.path + page.src.ext);
      const sassOptions: SassOptions = {
        load_paths: [...includes, posix.dirname(filename)],
        style: options.format,
        quiet: site.options.quiet,
      };

      const result = str(code, sassOptions);

      page.content = result;
      page.updateDest({ ext: ".css" });
    }
  };
}
