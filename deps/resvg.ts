import { Resvg } from "npm:@resvg/resvg-js@2.6.2";

export function toPng(svg: string): Uint8Array {
  const resvg = new Resvg(svg, { fitTo: { mode: "original" } });
  const pngData = resvg.render();
  return pngData.asPng();
}
