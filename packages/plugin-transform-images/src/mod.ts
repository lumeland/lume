import { getExtension, getPathAndExtension } from "@lumeland/core/utils/path.ts";
import { filesToPages } from "@lumeland/core/file.ts";
import { log, warnUntil } from "@lumeland/core/utils/log.ts";
import { Merge, merge } from "@lumeland/core/utils/object.ts";
import { concurrent } from "@lumeland/core/utils/concurrent.ts";
import { sharp } from "../deps/sharp.ts";
import { Resvg } from "../deps/resvg.ts";

import type Site from "@lumeland/core/site.ts";
import type { Page, StaticFile } from "@lumeland/core/file.ts";
import type { ResizeOptions, Sharp, SharpOptions } from "../deps/sharp.ts";
import type { ResvgRenderOptions } from "../deps/resvg.ts";

export interface Options {
  /** Custom transform functions */
  functions?: Record<string, TransformationFunction>;
  /** Limit number of images processed concurrently. Uses global concurrency limit if not set. */
  concurrency?: number;
}

export type TransformationFunction = (image: Sharp, ...args: any[]) => void;

// Default options
export const defaults = {
  functions: {
    resize(
      image: Sharp,
      width: number,
      height?: number,
      options: ResizeOptions = { withoutEnlargement: true },
    ): void {
      image.resize(width, height, options);
    },
    blur(image: Sharp, sigma?: number | boolean): void {
      image.blur(sigma);
    },
    rotate(image: Sharp, degrees: number): void {
      image.rotate(degrees);
    },
  },
  concurrency: 10,
} satisfies Options;
const supportedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".jp2",
  ".png",
  ".webp",
  ".gif",
  ".avif",
  ".heif",
  ".tiff",
]);

const filter = (fileOrPage: Page | StaticFile) =>
  supportedExtensions.has(getExtension(fileOrPage.outputPath)) && !!fileOrPage.data.transformImages;

export type Format =
  | "jpeg"
  | "jp2"
  // | "jxl" Not supported by sharp https://github.com/lumeland/lume/issues/630
  | "png"
  | "webp"
  | "gif"
  | "avif"
  | "heif"
  | "tiff";
export interface FormatOptions {
  format: Format;
  [key: string]: unknown;
}

export interface Transformation {
  suffix?: string;
  format?: Format | Format[] | FormatOptions | FormatOptions[];
  matches?: RegExp | string;
  [key: string]: any;
}
interface SingleTransformation extends Transformation {
  format?: Format | FormatOptions;
}

/**
 * A plugin to transform images in Lume
 * @see https://lume.land/plugins/transform_images/
 */
export function transformImages(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process(async function processTransformImages(_: Page[], allPages: Page[]) {
      // Load all static files that must be transformed
      await filesToPages(site.files, site.pages, filter);

      const files = allPages.filter(filter);

      const hasPages = warnUntil(
        "[transform_images plugin] No images to transform found. Make sure to add them with <code>site.add()</code>",
        files.length,
      );

      if (!hasPages) {
        return;
      }

      // Process all files
      await concurrent(files, (page) => processPage(page, allPages), options.concurrency);
    });

    // Configure the cache folder
    const { cache } = site;

    async function processPage(page: Page, allPages: Page[]) {
      const transData = page.data.transformImages as Transformation | Transformation[];

      const content = page.src.ext === ".svg" ? page.text : page.bytes;
      const url = page.data.url;

      const transformations = removeDuplicatedTransformations(getTransformations(transData));
      let transformed = false;
      let index = 0;
      let removeOriginal = false;

      for (const transformation of transformations) {
        if (transformation.matches) {
          const regex = new RegExp(transformation.matches);
          if (!regex.test(page.data.url as string)) {
            continue;
          }
        }

        const output = page.duplicate(index++, {
          ...page.data,
          transformImages: undefined,
        });

        rename(output, transformation);

        if (output.data.url.toLowerCase() === url.toLowerCase()) {
          removeOriginal = true;
        }

        if (cache) {
          const result = cache.getBytes([content, transformation]);

          if (result) {
            output.content = result;
          } else {
            await transform(content, output, transformation, options);
            transformed = true;
            cache.set([content, transformation], output.content!);
          }
        } else {
          await transform(content, output, transformation, options);
          transformed = true;
        }

        if (output !== page) {
          allPages.push(output);
        }
      }

      if (transformed) {
        log.info(`[transform_images plugin] Processed ${page.sourcePath}`);
      }

      // Remove the original page if a new one was created with the same URL
      if (removeOriginal) {
        allPages.splice(allPages.indexOf(page), 1);
      }
    }
  };
}

async function transform(
  content: Uint8Array | string,
  page: Page,
  transformation: Transformation,
  options: Merge<Options, typeof defaults>,
): Promise<void> {
  const ext = page.src.ext;
  const format = transformation.format;

  const ops = isAnimated(ext.slice(1)) && (!format || isAnimated(format)) ? { pages: -1 } : {};

  const image = create(content, ops);

  for (const [name, args] of Object.entries(transformation)) {
    switch (name) {
      case "suffix":
      case "matches":
        break;

      case "format":
        if (typeof args === "string") {
          image.toFormat(args as Format);
        } else {
          const { format, ...options } = args as Record<string, unknown>;
          image.toFormat(format as Format, options);
        }
        break;

      default:
        if (!options.functions[name]) {
          log.error(`[transform_images plugin] Unknown transformation: ${name}`);
          continue;
        }

        if (Array.isArray(args)) {
          options.functions[name](image, ...args);
        } else {
          options.functions[name](image, args);
        }
    }
  }

  page.content = new Uint8Array(await image.toBuffer());
}

function rename(page: Page, transformation: SingleTransformation): void {
  const { format, suffix } = transformation;
  let [path, ext] = getPathAndExtension(page.data.url);

  if (format) {
    ext = typeof format === "string" ? `.${format}` : `.${format.format}`;
  }

  if (suffix) {
    path += suffix;
  }

  page.data.url = path + ext;
}

function getTransformations(input: Transformation | Transformation[]): SingleTransformation[] {
  if (Array.isArray(input)) {
    const singles: SingleTransformation[] = [];

    for (const transformation of input) {
      if (Array.isArray(transformation.format)) {
        transformation.format.forEach((format) => {
          singles.push({ ...transformation, format });
        });
      } else {
        singles.push(transformation as SingleTransformation);
      }
    }
    return singles;
  }

  if (Array.isArray(input.format)) {
    return input.format.map((format) => ({ ...input, format }));
  }

  return [input as SingleTransformation];
}

function removeDuplicatedTransformations(
  transformations: SingleTransformation[],
): SingleTransformation[] {
  const result = new Map<string, SingleTransformation>();

  for (const transformation of transformations) {
    const { format, suffix, matches } = transformation;
    const formatKey = typeof format === "string" ? format : format?.format;
    const key = `${formatKey}:${suffix ?? ""}${matches ?? ""}`;
    result.set(key, transformation);
  }

  return [...result.values()];
}

export default transformImages;

/** Extends global data interface */
declare global {
  namespace Lume {
    export interface GlobalData {
      /**
       * Image transformations
       * @see https://lume.land/plugins/transform_images/
       */
      transformImages?: Transformation | Transformation[];
    }
  }
}

function isAnimated(format: unknown): boolean {
  return typeof format === "string" && (format === "gif" || format === "webp");
}

function toPng(
  svg: string,
  options: ResvgRenderOptions = { fitTo: { mode: "original" } },
): Uint8Array {
  const resvg = new Resvg(svg, options);
  const pngData = resvg.render();
  return pngData.asPng();
}

function create(
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
