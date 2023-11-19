import { getPathAndExtension } from "../core/utils/path.ts";
import { merge } from "../core/utils/object.ts";
import { concurrent } from "../core/utils/concurrent.ts";
import { log } from "../core/utils/log.ts";
import binaryLoader from "../core/loaders/binary.ts";
import { ImageMagick } from "../deps/imagick.ts";
import Cache from "../core/cache.ts";

import type Site from "../core/site.ts";
import type { Page } from "../core/file.ts";
import type { IMagickImage, MagickFormat } from "../deps/imagick.ts";

export interface Options {
  /** The list extensions this plugin applies to */
  extensions?: string[];

  /** The key name for the transformations definitions */
  name?: string;

  /** The cache folder */
  cache?: string | boolean;

  /** Custom transform functions */
  functions?: Record<string, TransformationFunction>;
}

export type TransformationFunction = (
  image: IMagickImage,
  // deno-lint-ignore no-explicit-any
  ...args: any[]
) => void;

// Default options
export const defaults: Options = {
  extensions: [".jpg", ".jpeg", ".png"],
  name: "imagick",
  cache: true,
  functions: {
    resize(image: IMagickImage, width: number, height = width): void {
      image.resize(width, height);
    },
    crop(image: IMagickImage, width: number, height = width): void {
      image.crop(width, height);
    },
    blur(image: IMagickImage, radius: number, sigma: number): void {
      image.blur(radius, sigma);
    },
    sharpen(image: IMagickImage, radius: number, sigma: number): void {
      image.sharpen(radius, sigma);
    },
    rotate(image: IMagickImage, degrees: number): void {
      image.rotate(degrees);
    },
    autoOrient(image: IMagickImage): void {
      image.autoOrient();
    },
  },
};

export interface Transformation {
  suffix?: string;
  format?: MagickFormat | MagickFormat[];
  matches?: RegExp | string;
  // deno-lint-ignore no-explicit-any
  [key: string]: any;
}
interface SingleTransformation extends Transformation {
  format?: MagickFormat;
}

/** A plugin to transform images in Lume */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadAssets(options.extensions, binaryLoader);
    site.process(
      options.extensions,
      (pages, allPages) => concurrent(pages, (page) => imagick(page, allPages)),
    );

    // Configure the cache folder
    const cacheFolder = options.cache === true ? "_cache" : options.cache;
    const cache = cacheFolder
      ? new Cache({ folder: site.src(cacheFolder) })
      : undefined;

    if (cacheFolder) {
      site.ignore(cacheFolder);
      site.options.watcher.ignore.push(cacheFolder);
    }

    async function imagick(page: Page, pages: Page[]) {
      const imagick = page.data[options.name] as
        | Transformation
        | Transformation[]
        | undefined;

      if (!imagick) {
        return;
      }

      const content = page.content as Uint8Array;
      const transformations = removeDuplicatedTransformations(
        getTransformations(imagick),
      );
      let transformed = false;
      let index = 0;
      for (const transformation of transformations) {
        if (transformation.matches) {
          const regex = new RegExp(transformation.matches);
          if (!regex.test(page.data.url as string)) {
            continue;
          }
        }

        const output = page.duplicate(index++, {
          ...page.data,
          [options.name]: undefined,
        });

        rename(output, transformation);

        if (cache) {
          const result = await cache.get(content, transformation);

          if (result) {
            output.content = result;
          } else {
            transform(content, output, transformation, options);
            transformed = true;
            await cache.set(content, transformation, output.content!);
          }
        } else {
          transform(content, output, transformation, options);
          transformed = true;
        }

        if (output !== page) {
          pages.push(output);
        }
      }

      if (transformed) {
        log.info(`[imagick plugin] Processed ${page.sourcePath}`);
      }

      // Remove the original page
      pages.splice(pages.indexOf(page), 1);
    }
  };
}

function transform(
  content: Uint8Array,
  page: Page,
  transformation: Transformation,
  options: Required<Options>,
): void {
  let format: MagickFormat | undefined = undefined;

  ImageMagick.read(content, (image: IMagickImage) => {
    for (const [name, args] of Object.entries(transformation)) {
      switch (name) {
        case "suffix":
        case "matches":
          break;

        case "format":
          format = args;
          break;

        default:
          if (!options.functions[name]) {
            throw new Error(`Unknown transformation: ${name}`);
          }

          if (Array.isArray(args)) {
            options.functions[name](image, ...args);
          } else {
            options.functions[name](image, args);
          }
      }
    }

    if (format) {
      image.write(
        format,
        (content: Uint8Array) => page.content = new Uint8Array(content),
      );
    } else {
      image.write((content: Uint8Array) =>
        page.content = new Uint8Array(content)
      );
    }
  });
}

function rename(page: Page, transformation: Transformation): void {
  const { format, suffix } = transformation;
  const url = page.data.url as string | undefined;

  if (!url) {
    return;
  }

  let [path, ext] = getPathAndExtension(url);

  if (format) {
    ext = `.${format}`;
  }

  if (suffix) {
    path += suffix;
  }

  page.data.url = path + ext;
}

function getTransformations(
  input: Transformation | Transformation[],
): SingleTransformation[] {
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
    const key = `${format}:${suffix ?? ""}${matches ?? ""}`;
    result.set(key, transformation);
  }

  return [...result.values()];
}

/** Extends PageData interface */
declare global {
  namespace Lume {
    export interface PageData {
      /**
       * Image transformations
       * @see https://lume.land/plugins/imagick/
       */
      imagick?: Transformation | Transformation[];
    }
  }
}
