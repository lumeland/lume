import postcss from "../deps/postcss.js";
import textLoader from "../loaders/text.js";

export default function () {
  return (site) => {
    site.load([".css"], textLoader, true);

    site.afterRender([".css"], transform);
  };

  async function transform(page) {
    const from = page.src.path + page.src.ext;
    const to = page.dest.path + page.dest.ext;
    const result = await postcss.process(
      page.content,
      { from, to },
    );

    page.content = result.css;
  }
}
