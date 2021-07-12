import {
  autoprefixer,
  postcss,
  postcssImport,
  postcssNesting,
} from "../deps/postcss.ts";
import { merge } from "../utils.ts";
import { Helper, Page, Site } from "../types.ts";

interface Options {
  extensions: string[];
  sourceMap: boolean;
  includes: string | string[];
  plugins: unknown[];
}

// Default options
const defaults: Options = {
  extensions: [".css"],
  sourceMap: false,
  includes: [],
  plugins: [
    postcssNesting(),
    autoprefixer(),
  ],
};

/** Plugin to load all .css files process them with PostCSS */
export default function (userOptions?: Partial<Options>) {
  return (site: Site) => {
    const options = merge(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );

    const plugins = [...options.plugins];

    if (options.includes) {
      plugins.unshift(postcssImport({
        path: Array.isArray(options.includes)
          ? options.includes.map((path) => site.src(path))
          : site.src(options.includes),
      }));
    }

    // @ts-ignore: Argument of type 'unknown[]' is not assignable to parameter of type 'AcceptedPlugin[]'.
    const runner = postcss(plugins);

    site.loadAssets(options.extensions);
    site.process(options.extensions, postCss);
    site.filter("postcss", filter as Helper, true);

    async function postCss(page: Page) {
      const from = site.src(page.src.path + page.src.ext);
      const to = site.dest(page.dest.path + page.dest.ext);
      const map = options.sourceMap ? { inline: false } : undefined;

      // Fix the code with postcss
      const result = await runner.process(page.content!, { from, to, map });

      page.content = result.css;

      if (result.map) {
        const mapFile = page.duplicate();
        mapFile.content = result.map.toString();
        mapFile.dest.ext = ".css.map";
        site.pages.push(mapFile);
      }
    }

    async function filter(code: string) {
      const result = await runner.process(code, { from: undefined });
      return result.css;
    }
  };
}
