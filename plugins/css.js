import textLoader from "../loaders/text.js";
import { join } from "../deps/path.js";
import {
  parse,
  Tasks,
  Coder,
  ImportPlugin,
} from "../deps/stylecow.js";
import { postcss, postcssPresetEnv } from "../deps/postcss.js";

export default function () {
  const coder = new Coder("normal");
  const tasks = new Tasks().use(ImportPlugin);
  const processor = postcss([
    postcssPresetEnv({
      stage: 1,
      features: {
        "custom-properties": false,
      },
    }),
  ]);

  return (site) => {
    site.load([".css"], textLoader, true);

    site.afterRender([".css"], transform);

    async function transform(page) {
      const from = join(site.options.src, page.src.path + page.src.ext);
      const to = join(site.options.dest, page.dest.path + page.dest.ext);

      //Resolve @import with stylecow
      const css = parse(page.rendered, "Root", null, from);
      tasks.run(css);

      //Fix the code with postcss
      const result = await processor.process(
        coder.run(css).css,
        { from, to },
      );

      page.rendered = result.css;
    }
  };
}
