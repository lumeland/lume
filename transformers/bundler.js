export default async function bundler(page) {
  if (!page.src.path.endsWith(".js") && !page.src.path.endsWith(".ts")) {
    return;
  }

  const from = page.src.path;

  const [diagnostics, emit] = await Deno.bundle(from, {
    [from]: page.content,
  });

  page.content = emit;
}
