import textLoader from "../loaders/text.js";
import { postcss, postcssPresetEnv } from "../deps/postcss.js";

export default function () {
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
  };

  async function transform(page) {
    const from = page.src.path + page.src.ext;
    const to = page.dest.path + page.dest.ext;
    const result = await processor.process(
      page.content,
      { from, to },
    );

    page.content = result.css;
  }
}
