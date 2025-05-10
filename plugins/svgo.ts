import { optimize } from "../deps/svgo.ts";
import { merge } from "../core/utils/object.ts";
import { warnUntil } from "../core/utils/log.ts";
import { bytes, percentage } from "../core/utils/format.ts";

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
      const hasPages = warnUntil(
        "[lightningcss plugin] No CSS files found. Make sure to add the CSS files with <code>site.add()</code>",
        files.length,
      );

      if (!hasPages) {
        return;
      }

      const item = site.debugBar?.buildItem(
        "[svgo plugin] optimization completed",
      );

      for (const file of files) {
        const path = site.src(file.outputPath);
        const content = file.text;
        const { data } = optimize(content, {
          path,
          ...options.options,
        }) as { data: string };

        if (item) {
          item.items ??= [];
          const old = content.length;
          const optimized = data.length;

          item.items.push({
            title: `[${percentage(old, optimized)}] ${file.data.url}`,
            details: `${bytes(optimized)}`,
          });
        }

        file.content = data;
      }
    }
  };
}

export default svgo;
