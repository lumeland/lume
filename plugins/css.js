import textLoader from "../loaders/text.js";
import { postcss, postcssImport, postcssNesting } from "../deps/postcss.js";

export default function (plugins = []) {
  return (site) => {
    const runner = postcss([
      postcssImport({
        path: site.src("_includes"),
      }),
      postcssNesting(),
      ...plugins,
    ]);

    site.loadAssets([".css"], textLoader);
    site.process([".css"], processor);

    async function processor(page) {
      const from = site.src(page.src.path + page.src.ext);
      const to = site.dest(page.dest.path + page.dest.ext);

      //Fix the code with postcss
      const result = await runner.process(
        page.content,
        { from, to },
      );

      page.content = result.css;
    }
  };
}
