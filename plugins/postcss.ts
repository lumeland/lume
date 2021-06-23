import {
  autoprefixer,
  postcss,
  postcssImport,
  postcssNesting,
} from "../deps/postcss.ts";
import { merge } from "../utils.ts";
import Site from "../site.ts";
import { Page } from "../filesystem.ts";

interface Options {
  extensions?: string[],
  sourceMap?: boolean,
  includes?: boolean | string,
  plugins?: unknown[]
}

// Default options
const defaults = {
  extensions: [".css"],
  sourceMap: false,
  includes: false,
  plugins: [
    postcssNesting(),
    autoprefixer(),
  ],
};

export default function (userOptions: Options = {}) {
  return (site: Site) => {
    const options = merge({
      ...defaults,
      includes: site.src("_includes"),
    }, userOptions);

    const plugins = [...options.plugins];

    if (options.includes) {
      plugins.unshift(postcssImport({
        path: options.includes,
      }));
    }

    const runner = postcss(plugins);

    site.loadAssets(options.extensions);
    site.process(options.extensions, postCss);
    site.filter("postcss", filter, true);

    async function postCss(page: Page) {
      const from = site.src(page.src.path + page.src.ext);
      const to = site.dest(page.dest.path + page.dest.ext);
      const map = options.sourceMap ? { inline: false } : undefined;

      // Fix the code with postcss
      const result = await runner.process(page.content, { from, to, map });

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
