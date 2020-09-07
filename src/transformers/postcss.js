import postcss from "../../deps/postcss.js";

export default async function transformCss(page) {
  if (!page.dest.path.endsWith(".css")) {
    return;
  }

  const from = page.src.path;
  const to = page.data.permalink;
  const result = await postcss.process(
    page.content,
    { from, to },
  );

  page.content = result.css;
}
