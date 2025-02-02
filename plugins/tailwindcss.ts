import { compile } from "../deps/tailwindcss.ts";
import { merge } from "../core/utils/object.ts";
import { log } from "../core/utils/log.ts";
import { dirname, posix } from "../deps/path.ts";

import type Site from "../core/site.ts";

export interface Options {
  /** Optimization level of the CSS code */
  optimize?: false | "optimize" | "minify";
}

export const defaults: Options = {
  optimize: "minify",
};

/**
 * A plugin to extract the utility classes from HTML pages and apply TailwindCSS
 * @see https://lume.land/plugins/tailwindcss/
 */
export function tailwindCSS(userOptions?: Options) {
  return (site: Site) => {
    const options = merge(defaults, userOptions);

    const cache = site.root("_cache/tailwindcss");

    site.process([".css"], async (files) => {
      if (files.length === 0) {
        log.info(
          "[tailwindcss plugin] No CSS files found. Make sure to add the CSS files with <gray>site.add()</gray>",
        );
        return;
      }

      for (const file of files) {
        const result = await compile(file.text, {
          base: posix.dirname(file.outputPath),
          onDependency(path) {
            console.log("onDependency", path);
          },
          async customJsResolver(id, base) {
            console.log("customJsResolver", { id, base });
            return "npm:tailwindcss@4.0.2";
            return undefined;
          },
          async customCssResolver(id, base) {
            console.log("customCssResolver", { id, base});
            return undefined;
          }
        });
      }
    });
  };
}

export default tailwindCSS;
