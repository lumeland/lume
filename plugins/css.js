import textLoader from "../loaders/text.js";
import { join } from "../deps/path.js";
import { Coder, ImportPlugin, parse, Tasks } from "../deps/stylecow.js";
import { postcss, postcssPresetEnv } from "../deps/postcss.js";

export default function () {
  const coder = new Coder("normal");
  const tasks = new Tasks().use(ImportPlugin);
  const runner = postcss([
    postcssPresetEnv({
      stage: 1,
      features: {
        "custom-properties": false,
      },
    }),
  ]);

  return (site) => {
    site.loadAssets([".css"], textLoader);
    site.process([".css"], processor);

    async function processor(page) {
      const from = join(site.options.src, page.src.path + page.src.ext);
      const to = join(site.options.dest, page.dest.path + page.dest.ext);

      //Resolve @import with stylecow
      const css = parse(page.content, "Root", null, from);
      tasks.run(css);

      //Fix the code with postcss
      const result = await runner.process(
        coder.run(css).css,
        { from, to },
      );

      page.content = result.css;
    }
  };
}
