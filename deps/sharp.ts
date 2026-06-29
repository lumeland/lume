import sharp from "npm:sharp@0.35.2";
import icoEndec from "npm:ico-endec@0.1.6";

export type { FormatEnum, ResizeOptions, Sharp } from "npm:sharp@0.35.2";
import type { Sharp, SharpOptions } from "npm:sharp@0.35.2";
import { type ResvgRenderOptions, toPng } from "./resvg.ts";

export async function sharpsToIco(...images: Sharp[]) {
  const buffers = await Promise.all(
    images.map((image) => image.toFormat("png").toBuffer()),
  );

  // deno-lint-ignore no-explicit-any
  return icoEndec.encode(buffers.map((buffer: any) => buffer.buffer));
}

export function create(
  content: Uint8Array | string,
  config: SharpOptions = {},
  svgOptions?: ResvgRenderOptions,
): Sharp {
  // It's a SVG
  if (typeof content === "string") {
    return sharp(toPng(content, svgOptions));
  }

  return sharp(content, config);
}
