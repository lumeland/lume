import textLoader from "../loaders/text.js";
import { Tasks, Coder, parse, ImportPlugin, NestedRulesPlugin } from "../deps/stylecow.js";
import { join } from "../deps/path.js";

export default function () {
  const coder = new Coder("normal");
  const tasks = new Tasks()
    .use(ImportPlugin)
    .use(NestedRulesPlugin);

  return (site) => {
    site.load([".css"], textLoader, true);

    site.afterRender([".css"], transform);

    async function transform(page) {
      const from = join(site.options.src, page.src.path + page.src.ext);
      const css = parse(page.content, "Root", null, from);
      tasks.run(css);
      const result = coder.run(css);
  
      page.content = result.css;
    }
  }
}
