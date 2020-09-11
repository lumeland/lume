import postcss from "../../deps/postcss.js";
import textLoader from "../loaders/text.js";

export default function () {
  return (site) => {
    site.load([".css"], textLoader);

    site.afterRender([".css"], transform);
  };

  async function transform(page) {
    const from = page.src.path;
    const to = page.data.permalink;
    const result = await postcss.process(
      page.content,
      { from, to },
    );

    page.content = result.css;
  }
}
