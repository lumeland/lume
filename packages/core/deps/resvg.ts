import { Resvg, type ResvgRenderOptions } from "@resvg/resvg-js";
export type { ResvgRenderOptions };

export function toPng(
  svg: string,
  options: ResvgRenderOptions = { fitTo: { mode: "original" } },
): Uint8Array {
  const resvg = new Resvg(svg, options);
  const pngData = resvg.render();
  return pngData.asPng();
}
