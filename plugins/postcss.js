import {
  autoprefixer,
  postcss,
  postcssImport,
  postcssNesting,
} from "../deps/postcss.js";
import { merge } from "../utils.ts";

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

export default function (userOptions = {}) {
  return (site) => {
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

    async function postCss(page) {
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

    async function filter(code) {
      const result = await runner.process(code, { from: undefined });
      return result.css;
    }
  };
}
