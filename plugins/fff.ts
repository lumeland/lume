import type Site from "../core/site.ts";
import { getGitDate } from "../core/utils/date.ts";
import { merge } from "../core/utils/object.ts";

import {
  type FFFFlavoredFrontmatter,
  type FFFTransformPreset,
  postTypeDiscovery,
  strict,
  type StrictPresetOptions,
  transform,
} from "../deps/fff.ts";

export interface Options {
  presets: FFFTransformPreset[];
  strict: false | StrictPresetOptions;
  date?: "created" | "updated" | "published";
  getGitDate?: boolean;
  postTypeDiscovery?: boolean;
}

// Default options
export const defaults: Options = {
  presets: [],
  strict: false,
};

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.preprocess([".html"], (pages) =>
      pages.forEach((page) => {
        if (options.getGitDate && page.src.entry) {
          page.data.created = getGitDate("created", page.src.entry.src);
          page.data.updated = getGitDate("modified", page.src.entry.src);
        }

        page.data = transform(page.data, [
          ...options.presets,
          ...(options.date ? [{ "date": options.date }] : []),
          ...(options.strict === false ? [] : [strict(options.strict)]),
        ]);

        if (options.postTypeDiscovery) {
          page.data.type = postTypeDiscovery(page.data);
        }
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
