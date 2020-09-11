import textLoader from "../loaders/text.js";

export default function () {
  return (site) => {
    site.load([".ts", ".js"], textLoader, true);

    site.afterRender([".ts", ".js"], transform);
  };

  async function transform(page) {
    const from = page.src.path + page.src.ext;

    const [diagnostics, emit] = await Deno.bundle(from, {
      [from]: page.content,
    });

    page.content = emit;
    page.dest.ext = ".js";
  }
}
