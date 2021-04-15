import textLoader from "../loaders/text.js";
import { postcss, postcssImport, postcssNesting } from "../deps/postcss.js";
import { merge } from "../utils.js";

// Default options
const defaults = {
  extensions: [".css"],
  sourceMap: false,
  plugins: [
    postcssNesting(),
  ],
};

export default function (userOptions = {}) {
  const options = merge(defaults, userOptions);

  return (site) => {
    const runner = postcss([
      postcssImport({
        path: site.src("_includes"),
      }),
      ...options.plugins,
    ]);

    site.loadAssets(options.extensions, textLoader);
    site.process(options.extensions, processor);

    async function processor(page) {
      const from = site.src(page.src.path + page.src.ext);
      const to = site.dest(page.dest.path + page.dest.ext);
      const map = options.sourceMap ? { inline: false } : undefined;

      // Fix the code with postcss
      const result = await runner.process(
        page.content,
        { from, to, map },
      );

      page.content = result.css;

      if (result.map) {
        const mapFile = page.duplicate();
        mapFile.content = result.map.toString();
        mapFile.dest.ext = ".css.map";
        site.pages.push(mapFile);
      }
    }
  };
}
