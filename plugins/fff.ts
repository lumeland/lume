import { PostType } from "https://deno.land/x/fff@v1.2.1/src/utils/ptd.ts";
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
import { Data } from "../core/file.ts";

export interface FFFPluginData
  extends Data, Omit<FFFFlavoredFrontmatter, "lang" | "tags"> {
  type?: PostType;
}

export interface Options {
  /**
   * The list of presets to apply
   * @see https://fff.js.org/concepts/flavor-transform.html#fff-transform-preset
   */
  presets?: FFFTransformPreset[];
  strict?: false | StrictPresetOptions;
  /** To convert the generic `date` field to one of these values */
  date?: "created" | "updated" | "published";
  /** Get the date from the git history */
  getGitDate?: boolean;
  postTypeDiscovery?: boolean;
}

// Default options
export const defaults = {
  presets: [],
  strict: false,
} satisfies Options;

/**
 * A plugin to transform frontmatter using FFF
 * @see https://lume.land/plugins/fff/
 */
export function fff(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return <D extends FFFPluginData>(site: Site<D>) => {
    site.preprocess([".html"], function processFFF(pages) {
      for (const page of pages) {
        if (options.getGitDate && page.src.entry) {
          if (!page.data.created) {
            page.data.created = getGitDate("created", page.src.entry.src)
              ?.toDateString();
          }
          if (!page.data.updated) {
            page.data.updated = getGitDate("modified", page.src.entry.src)
              ?.toDateString();
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
      }
    });
  };
}

export default fff;
