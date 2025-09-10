export { default } from "npm:sharp@0.34.3";
import sharp from "npm:sharp@0.34.3";
import icoEndec from "npm:ico-endec@0.1.6";
import { toPng } from "./resvg.ts";

export async function sharpsToIco(...images: sharp.Sharp[]) {
  const buffers = await Promise.all(
    images.map((image) => image.toFormat("png").toBuffer()),
  );

  // deno-lint-ignore no-explicit-any
  return icoEndec.encode(buffers.map((buffer: any) => buffer.buffer));
}

export function create(
  content: Uint8Array | string,
  config: sharp.SharpOptions = {},
): sharp.Sharp {
  // It's a SVG
  if (typeof content === "string") {
    return sharp(toPng(content));
  }

  return sharp(content, config);
}
