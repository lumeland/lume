import { merge } from "../core/utils/object.ts";

import {
  type FFFFlavoredFrontmatter,
  type FFFTransformPreset,
  strict,
  type StrictPresetOptions,
  transform,
} from "../deps/fff.ts";

export interface Options {
  presets: FFFTransformPreset[];
  strict: false | StrictPresetOptions;
  date?: "created" | "updated" | "published";
}

// Default options
export const defaults: Options = {
  presets: [],
  strict: false,
};

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Lume.Site) => {
    site.preprocess([".html"], (pages) =>
      pages.forEach((page) => {
        page.data = transform(page.data, [
          ...options.presets,
          ...(options.date ? [{ "date": options.date }] : []),
          ...(options.strict === false ? [] : [strict(options.strict)]),
        ]);
      }));
  };
}

/** Extends Data interface */
declare global {
  namespace Lume {
    // deno-lint-ignore no-empty-interface
    export interface Data
      extends Omit<FFFFlavoredFrontmatter, "lang" | "tags"> {}
  }
}
