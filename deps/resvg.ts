import { initWasm, Resvg } from "npm:@resvg/resvg-wasm@2.6.2";

const url =
  "https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@2.6.2/index_bg.wasm";
await initWasm(url);

export function toPng(svg: string): Uint8Array {
  const resvg = new Resvg(svg, { fitTo: { mode: "original" } });
  const pngData = resvg.render();
  return pngData.asPng();
}
