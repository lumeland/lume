import { merge } from "../core/utils.ts";
import binaryLoader from "../core/loaders/binary.ts";
import { Exception } from "../core/errors.ts";
import { ImageMagick, initializeImageMagick } from "../deps/imagick.ts";
import Cache from "../core/cache.ts";

import type { Page, Site } from "../core.ts";
import type { IMagickImage, MagickFormat } from "../deps/imagick.ts";

await initializeImageMagick();

export interface Options {
  /** The list extensions this plugin applies to */
  extensions: string[];

  /** The key name for the transformations definitions */
  name: string;

  /** The cache folder */
  cache: string | boolean;

  /** Custom transform functions */
  functions: Record<string, TransformationFunction>;
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
  format?: MagickFormat;
  // deno-lint-ignore no-explicit-any
  [key: string]: any;
}

export type Transformations = Transformation[];

/** A plugin to transform images in Lume */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadAssets(options.extensions, binaryLoader);
    site.process(options.extensions, imagick);

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
        | Transformations
        | undefined;

      if (!imagick) {
        return;
      }

      const content = page.content as Uint8Array;
      const transformations = Array.isArray(imagick) ? imagick : [imagick];
      let transformed = false;
      let index = 0;
      for (const transformation of transformations) {
        const output = page.duplicate(index++, { [options.name]: undefined });

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
        site.logger.log("🎨", `${page.src.path}${page.src.ext}`);
      }

      // Remove the original page
      return false;
    }
  };
}

function transform(
  content: Uint8Array,
  page: Page,
  transformation: Transformation,
  options: Options,
): void {
  let format: MagickFormat | undefined = undefined;

  ImageMagick.read(content, (image: IMagickImage) => {
    for (const [name, args] of Object.entries(transformation)) {
      switch (name) {
        case "suffix":
          break;

        case "format":
          format = args;
          break;

        default:
          if (!options.functions[name]) {
            throw new Exception(`Unknown transformation: ${name}`);
          }

          if (Array.isArray(args)) {
            options.functions[name](image, ...args);
          } else {
            options.functions[name](image, args);
          }
      }
    }

    image.write(
      (content: Uint8Array) => page.content = new Uint8Array(content),
      format,
    );
  });
}

function rename(page: Page, transformation: Transformation): void {
  const { format, suffix } = transformation;

  if (format) {
    page.updateDest({ ext: "." + format });
  }

  if (suffix) {
    page.updateDest({ path: page.dest.path + suffix });
  }
}
