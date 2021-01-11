import textLoader from "../loaders/text.js";
import { postcss, postcssImport, postcssNesting } from "../deps/postcss.js";

export default function (options = {}) {
  const { plugins = [postcssNesting()] } = options;

  return (site) => {
    const runner = postcss([
      postcssImport({
        path: site.src("_includes"),
      }),
      ...plugins,
    ]);

    site.loadAssets([".css"], textLoader);
    site.process([".css"], processor);

    async function processor(page) {
      const from = site.src(page.src.path + page.src.ext);
      const to = site.dest(page.dest.path + page.dest.ext);
      const map = options.map ? { inline: false } : undefined;

      //Fix the code with postcss
      const result = await runner.process(
        page.content,
        { from, to, map },
      );

      page.content = result.css;

      if (result.map) {
        const mapPage = page.duplicate();
        mapPage.content = result.map.toString();
        mapPage.dest.ext = ".css.map";
        site.pages.push(mapPage);
      }
    }
  };
}
