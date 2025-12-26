import {
  initWasm,
  Resvg,
  type ResvgRenderOptions,
} from "npm:@resvg/resvg-wasm@2.6.2";
import { read } from "../core/utils/read.ts";
export type { ResvgRenderOptions };

const url =
  "https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@2.6.2/index_bg.wasm";
await initWasm(read(url, true));

export function toPng(
  svg: string,
  options: ResvgRenderOptions = { fitTo: { mode: "original" } },
): Uint8Array {
  const resvg = new Resvg(svg, options);
  const pngData = resvg.render();
  return pngData.asPng();
}
