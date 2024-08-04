import { merge } from "../core/utils/object.ts";
import { matchExtension } from "../core/utils/path.ts";
import createSlugifier, {
  defaults as slugifierDefaults,
} from "../core/slugifier.ts";

import type Site from "../core/site.ts";
import type { Page } from "../core/file.ts";
import type { Extensions } from "../core/utils/path.ts";
import type { Options as SlugifierOptions } from "../core/slugifier.ts";

export interface Options extends SlugifierOptions {
  /** The list of extensions this plugin applies to */
  extensions?: Extensions;
}

// Default options
export const defaults: Options = {
  extensions: [".html"],
  ...slugifierDefaults,
};

/**
 * A plugin to slugify all URLs, replacing non-URL-safe characters
 * @see https://lume.land/plugins/slugify_urls/
 */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);
  const slugify = createSlugifier(options);

  return (site: Site) => {
    site.filter("slugify", slugify);
    site.preprocess(options.extensions, (pages) => pages.forEach(slugifyUrls));

    // Slugify the static files
    site.addEventListener("beforeRender", () => {
      site.files
        .filter((file) => matchExtension(options.extensions, file.outputPath))
        .forEach((file) => file.outputPath = slugify(file.outputPath));
    });
  };

  function slugifyUrls(page: Page) {
    if (typeof page.data.url === "string") {
      page.data.url = slugify(page.data.url);
    }
  }
}

/** Extends Helpers interface */
declare global {
  namespace Lume {
    export interface Helpers {
      /** @see https://lume.land/plugins/slugify_urls/ */
      slugify: (string: string) => string;
    }
  }
}
