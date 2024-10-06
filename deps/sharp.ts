export { default } from "npm:sharp@0.33.5";
import sharp from "npm:sharp@0.33.5";
import icoEndec from "npm:ico-endec@0.1.6";
import { svg2png } from "./svg2png.ts";

export async function sharpsToIco(...images: sharp.Sharp[]) {
  const buffers = await Promise.all(
    images.map((image) => image.toFormat("png").toBuffer()),
  );

  return icoEndec.encode(buffers.map((buffer) => buffer.buffer));
}

export async function create(
  content: Uint8Array | string,
): Promise<sharp.Sharp> {
  // It's a SVG
  if (typeof content === "string") {
    return sharp(await svg2png(content));
  }

  return sharp(content, { pages: -1 });
}
