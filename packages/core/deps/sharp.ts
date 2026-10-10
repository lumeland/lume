import sharp from "sharp";
import icoEndec from "ico-endec";

export type { FormatEnum, ResizeOptions, Sharp } from "sharp";
import type { Sharp, SharpOptions } from "sharp";
import { type ResvgRenderOptions, toPng } from "./resvg.ts";

export async function sharpsToIco(...images: Sharp[]) {
  const buffers = await Promise.all(images.map((image) => image.toFormat("png").toBuffer()));

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
