import { optimize } from "../deps/svgo.ts";
import { merge } from "../core/utils/object.ts";
import { log } from "../core/utils/log.ts";

import type Site from "../core/site.ts";
import type { Page } from "../core/file.ts";
import type { Config } from "../deps/svgo.ts";

export interface Options {
  /** Options passed to SVGO. See https://github.com/svg/svgo#configuration */
  options?: Config;
}

// Default options
export const defaults: Options = {};

/**
 * A plugin to load all SVG files and minify them using SVGO
 * @see https://lume.land/plugins/svgo/
 */
export function svgo(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process([".svg"], SVGProcessor);

    function SVGProcessor(files: Page[]) {
      if (files.length === 0) {
        log.info(
          "[lightningcss plugin] No CSS files found. Make sure to add the CSS files with <gray>site.add()</gray>",
        );
        return;
      }

      for (const file of files) {
        const path = site.src(file.outputPath);
        const result = optimize(file.text, {
          path,
          ...options.options,
        }) as { data: string };

        file.content = result.data;
      }
    }
  };
}

export default svgo;
