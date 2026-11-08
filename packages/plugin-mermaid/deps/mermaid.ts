import mermaid from "mermaid";

export function renderToSvg(code: string) {
  return mermaid.render("id", code);
}
