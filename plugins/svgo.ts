import { optimize } from "../deps/svgo.ts";
import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";
import type { Page } from "../core/file.ts";
import type { Config } from "../deps/svgo.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];

  /** Options passed to SVGO. See https://github.com/svg/svgo#configuration */
  options?: Config;
}

// Default options
export const defaults: Options = {
  extensions: [".svg"],
};

/**
 * A plugin to load all SVG files and minify them using SVGO
 * @see https://lume.land/plugins/svgo/
 */
export function svgo(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadAssets(options.extensions);
    site.process(options.extensions, (pages) => pages.forEach(svg));

    function svg(page: Page) {
      const path = site.src(page.outputPath);
      const result = optimize(page.content as string, {
        path,
        ...options.options,
      }) as { data: string };

      page.content = result.data;
    }
  };
}

export default svgo;
