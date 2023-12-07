export { default } from "npm:sharp@0.33.0";

import sharp from "npm:sharp@0.33.0";
import icoEndec from "npm:ico-endec@0.1.6";

export async function sharpsToIco(...images: sharp.Sharp[]) {
  const buffers = await Promise.all(
    images.map((image) => image.toFormat("png").toBuffer()),
  );

  return icoEndec.encode(buffers.map((buffer) => buffer.buffer));
}
