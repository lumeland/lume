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
  /** The list extensions this plugin applies to */
  extensions: string[];
  /**
   * The list of presets to apply
   * @see https://fff.js.org/concepts/flavor-transform.html#fff-transform-preset
   */
  presets: FFFTransformPreset[];
  strict: false | StrictPresetOptions;
  /** To convert the generic `date` field to one of these values */
  date?: "created" | "updated" | "published";
  /** Get the date from the git history */
  getGitDate?: boolean;
  postTypeDiscovery?: boolean;
}

// Default options
export const defaults: Options = {
  extensions: [".html"],
  presets: [],
  strict: false,
};

export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.preprocess(options.extensions, (pages) =>
      pages.forEach((page) => {
        if (options.getGitDate && page.src.entry) {
          if (!page.data.created) {
            page.data.created = getGitDate("created", page.src.entry.src);
          }
          if (!page.data.updated) {
            page.data.updated = getGitDate("modified", page.src.entry.src);
          }
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
    export interface Data
      extends Omit<FFFFlavoredFrontmatter, "lang" | "tags"> {}
  }
}
