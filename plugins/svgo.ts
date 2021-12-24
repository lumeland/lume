import { optimize } from "../deps/svgo.ts";
import { merge } from "../core/utils.ts";

import type { Page, Site } from "../core.ts";
import type { SvgoOptions } from "../deps/svgo.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Options passed to SVGO */
  options: Partial<SvgoOptions>;
}

// Default options
export const defaults: Options = {
  extensions: [".svg"],
  options: {},
};

/** A plugin to load all SVG files and minify them using SVGO */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadAssets(options.extensions);
    site.process(options.extensions, svg);

    async function svg(page: Page) {
      const path = site.src(page.dest.path + page.dest.ext);
      const result = await optimize(page.content, {
        path,
        ...options.options,
      }) as { data: string };

      page.content = result.data;
    }
  };
}
