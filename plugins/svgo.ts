import { optimize, SvgoOptions } from "../deps/svgo.ts";
import { merge } from "../core/utils.ts";
import { Page, Site } from "../core.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions: string[];

  /** Options passed to SVGO */
  options: Partial<SvgoOptions>;
}

// Default options
const defaults: Options = {
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
