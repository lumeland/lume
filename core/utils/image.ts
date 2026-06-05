import sharp, { create, sharpsToIco } from "../../deps/sharp.ts";

import type { ResvgRenderOptions } from "../../deps/resvg.ts";
import type Cache from "../cache.ts";

export async function buildIcon(
  content: Uint8Array | string,
  format: keyof sharp.FormatEnum | "ico",
  size: number[],
  cache?: Cache,
): Promise<Uint8Array<ArrayBuffer>> {
  if (cache) {
    const result = await cache.getBytes([content, format, size]);

    if (result) {
      return result;
    }
  }

  const svgOptions: ResvgRenderOptions = {
    fitTo: { mode: "width", value: Math.max(...size) },
  };
  let image: Uint8Array<ArrayBuffer>;

  if (format === "ico") {
    const resizeOptions = { background: { r: 0, g: 0, b: 0, alpha: 0 } };
    const img = create(content, undefined, svgOptions);
    image = await sharpsToIco(
      ...size.map((size) => img.clone().resize(size, size, resizeOptions)),
    );
  } else {
    image = await create(content, undefined, svgOptions)
      .resize(size[0], size[0])
      .toFormat(format)
      .toBuffer() as Uint8Array<ArrayBuffer>;
  }

  if (cache) {
    cache.set([content, format, size], image);
  }

  return image;
}