import textLoader from "../loaders/text.js";

export default function () {
  return (site) => {
    site.loadAssets([".ts", ".js"], textLoader);
    site.process([".ts", ".js"], processor);
  };

  async function processor(page) {
    const from = page.src.path + page.src.ext;

    const [diagnostics, emit] = await Deno.bundle(from, {
      [from]: page.content,
    });

    page.content = emit;
    page.dest.ext = ".js";
  }
}
