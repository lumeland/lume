import { posix } from "../deps/path.ts";
import { getPathAndExtension } from "../core/utils.ts";
import { typeByExtension } from "../deps/media_types.ts";

import type { Transformation } from "../plugins/imagick.ts";
import type { MagickFormat } from "../deps/imagick.ts";
import type { Document, Element } from "../deps/dom.ts";
import type { Plugin, Site } from "../core.ts";

interface SourceFormat {
  width: number;
  scales: Record<string, number>;
  format: string;
}

interface Source extends SourceFormat {
  paths: string[];
}

export default function (): Plugin {
  return (site: Site) => {
    const transforms = new Map<string, Source>();

    site.process([".html"], (page) => {
      const { document } = page;

      if (!document) {
        return;
      }

      const basePath = posix.dirname(page.outputPath!);
      const nodeList = document.querySelectorAll("img");

      for (const node of nodeList) {
        const img = node as Element;
        const imagick = closest(img, "[imagick]")?.getAttribute("imagick");

        if (!imagick) {
          continue;
        }

        if (!img.getAttribute("src")) {
          throw new Error("img element must have a src attribute");
        }

        const picture = closest(img, "picture");

        if (picture) {
          handlePicture(imagick, img, picture, basePath);
          continue;
        }

        handleImg(imagick, img, basePath);
      }
    });

    site.process([".html"], (page) => {
      page.document?.querySelectorAll("[imagick]").forEach((element) => {
        (element as Element).removeAttribute("imagick");
      });
    });

    site.process("*", (page) => {
      const path = page.outputPath!;

      for (const { paths, width, scales, format } of transforms.values()) {
        if (!paths.includes(path)) {
          continue;
        }
        const imagick: Transformation[] = page.data.imagick
          ? Array.isArray(page.data.imagick)
            ? page.data.imagick
            : [page.data.imagick]
          : (page.data.imagick = []);

        for (const [suffix, scale] of Object.entries(scales)) {
          imagick.push({
            resize: width * scale,
            suffix,
            format: format as MagickFormat,
          });
        }
      }
    });

    function handlePicture(
      imagick: string,
      img: Element,
      picture: Element,
      basePath: string,
    ) {
      const src = img.getAttribute("src") as string;
      const sizes = img.getAttribute("sizes");
      const sourceFormats = saveTransform(basePath, src, imagick);

      for (const sourceFormat of sourceFormats) {
        const source = createSource(
          img.ownerDocument!,
          src,
          sourceFormat,
          sizes,
        );
        picture.insertBefore(source, img);
      }
    }

    function handleImg(imagick: string, img: Element, basePath: string) {
      const src = img.getAttribute("src") as string;
      const sizes = img.getAttribute("sizes");
      const sourceFormats = saveTransform(basePath, src, imagick);
      const picture = img.ownerDocument!.createElement("picture");

      img.replaceWith(picture);

      for (const sourceFormat of sourceFormats) {
        const source = createSource(
          img.ownerDocument!,
          src,
          sourceFormat,
          sizes,
        );
        picture.append(source);
      }

      picture.append(img);
    }

    function saveTransform(
      basePath: string,
      src: string,
      imagick: string,
    ): SourceFormat[] {
      const path = src.startsWith("/") ? src : posix.join(basePath, src);
      const sizes: string[] = [];
      const formats: string[] = [];

      imagick.split(/\s+/).forEach((piece) => {
        if (piece.match(/^\d/)) {
          sizes.push(piece);
        } else {
          formats.push(piece);
        }
      });

      const sourceFormats: SourceFormat[] = [];

      for (const size of sizes) {
        const [width, scales] = parseSize(size);

        for (const format of formats) {
          const key = `${width}:${format}`;
          const sourceFormat = {
            width,
            format,
            scales: {} as Record<string, number>,
          };
          sourceFormats.push(sourceFormat);

          for (const scale of scales) {
            const suffix = `-${width}w${scale === 1 ? "" : `@${scale}`}`;
            sourceFormat.scales[suffix] = scale;
          }

          const transform = transforms.get(key);

          if (transform) {
            if (!transform.paths.includes(path)) {
              transform.paths.push(path);
            }

            Object.assign(transform.scales, sourceFormat.scales);
          } else {
            transforms.set(key, {
              ...sourceFormat,
              paths: [path],
            });
          }
        }
      }

      return sourceFormats;
    }
  };
}

function parseSize(size: string): [number, number[]] {
  const match = size.match(/^(\d+)(@([\d.,]+))?$/);

  if (!match) {
    throw new Error(`Invalid size: ${size}`);
  }

  const [, width, , scales] = match;

  // Use a Set to avoid duplicates
  const sizes = new Set<number>([1]);
  scales?.split(",").forEach((size) => sizes.add(parseFloat(size)));

  return [
    parseInt(width),
    [...sizes.values()],
  ];
}

function createSource(
  document: Document,
  src: string,
  srcFormat: SourceFormat,
  sizes?: string | null | undefined,
) {
  const source = document.createElement("source");
  const { scales, format, width } = srcFormat;
  const path = encodeURI(getPathAndExtension(src)[0]);
  const srcset: string[] = [];

  for (const [suffix, scale] of Object.entries(scales)) {
    const scaleSuffix = sizes
      ? ` ${scale * width}w`
      : scale === 1
      ? ""
      : ` ${scale}x`;
    srcset.push(`${path}${suffix}.${format}${scaleSuffix}`);
  }

  source.setAttribute("srcset", srcset.join(", "));
  source.setAttribute("type", typeByExtension(format));

  if (sizes) {
    source.setAttribute("sizes", sizes);
  }

  return source;
}

// Missing Element.closest in Deno DOM (https://github.com/b-fuze/deno-dom/issues/99)
function closest(element: Element, selector: string) {
  while (element && !element.matches(selector)) {
    element = element.parentElement!;
  }
  return element;
}
