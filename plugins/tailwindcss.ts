import tailwind, { Config } from "../deps/tailwindcss.ts";
import { getExtension } from "../core/utils/path.ts";
import { merge } from "../core/utils/object.ts";

import type Site from "../core/site.ts";

export interface Options {
  /** Extensions processed by this plugin to extract the utility classes */
  extensions?: string[];

  /**
   * Options passed to TailwindCSS.
   * @see https://tailwindcss.com/docs/configuration
   */
  options?: Omit<Config, "content">;
}

export const defaults: Options = {
  extensions: [".html"],
};

export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    // deno-lint-ignore no-explicit-any
    let tailwindPlugins: any[];

    if (site.hooks.postcss) {
      throw new Error(
        "PostCSS plugin is required to be installed AFTER TailwindCSS plugin",
      );
    }

    site.processAll(options.extensions, (pages) => {
      // Get the content of all HTML pages (sorted by path)
      const content = pages.sort((a, b) => a.src.path.localeCompare(b.src.path))
        .map((page) => ({
          raw: page.content as string,
          extension: getExtension(page.outputPath || "").substring(1),
        }));

      // Create Tailwind plugin
      // @ts-ignore: This expression is not callable.
      const plugin = tailwind({
        ...options.options,
        content,
      });

      // Ensure PostCSS plugin is installed
      if (!site.hooks.postcss) {
        throw new Error(
          "PostCSS plugin is required to be installed AFTER TailwindCSS plugin",
        );
      }

      // Replace the old Tailwind plugin configuration from PostCSS plugins
      // deno-lint-ignore no-explicit-any
      site.hooks.postcss((runner: any) => {
        tailwindPlugins?.forEach((plugin) => {
          runner.plugins.splice(runner.plugins.indexOf(plugin), 1);
        });
        tailwindPlugins = runner.normalize([plugin]);
        runner.plugins = runner.plugins.concat(tailwindPlugins);
      });
    });
  };
}
