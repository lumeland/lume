import { merge } from "../core/utils.ts";
import binaryLoader from "../core/loaders/binary.ts";
import { Exception } from "../core/errors.ts";
import { ImageMagick, initializeImageMagick } from "../deps/imagick.ts";

import type { Page, Site } from "../core.ts";
import type { IMagickImage, MagickFormat } from "../deps/imagick.ts";

await initializeImageMagick();

export interface Options {
  /** The list extensions this plugin applies to */
  extensions: string[];

  /** The key name for the transformations definitions */
  name: string;

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

    function imagick(page: Page) {
      const imagick = page.data[options.name] as
        | Transformation
        | Transformations
        | undefined;

      if (!imagick || page._data.imagick === JSON.stringify(imagick)) {
        // No transformation or already processed
        return;
      }

      page._data.imagick = JSON.stringify(imagick);
      site.logger.log("🎨", `${page.src.path}${page.src.ext}`);

      const content = page.content as Uint8Array;
      const transformations = Array.isArray(imagick) ? imagick : [imagick];
      const last = transformations[transformations.length - 1];

      for (const transformation of transformations) {
        const output = transformation === last
          ? page
          : page.duplicate({ [options.name]: undefined });

        transform(content, output, transformation, options);

        if (output !== page) {
          site.pages.push(output);
        }
      }
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
          page.path += args;
          break;

        case "format":
          format = args;
          page.ext = "." + args.toLowerCase();
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
