import { merge } from "@lumeland/core/utils/object.ts";
import { getPathAndExtension, matchExtension } from "@lumeland/core/utils/path.ts";
import createSlugifier, { defaults as slugifierDefaults } from "@lumeland/core/slugifier.ts";

import type Site from "@lumeland/core/site.ts";
import type { Extensions } from "@lumeland/core/utils/path.ts";
import type { Options as SlugifierOptions } from "@lumeland/core/slugifier.ts";
import { getBasename } from "@lumeland/core/utils/page_url.ts";
import { StaticFile } from "@lumeland/core/file.ts";

export interface Options extends SlugifierOptions {
  /** File extensions to slugify */
  extensions?: Extensions;
}

// Default options
export const defaults = {
  extensions: [".html"],
  ...slugifierDefaults,
} satisfies Options;

/**
 * A plugin to slugify all URLs, replacing non-URL-safe characters
 * @see https://lume.land/plugins/slugify_urls/
 */
export function slugifyUrls(userOptions?: Options) {
  const options = merge(defaults, userOptions);
  const slugify = createSlugifier(options);

  return (site: Site) => {
    site.filter<{ lang?: string }>("slugify", function (text: string, lang?: string) {
      return slugify(text, lang ?? this?.data?.lang);
    });

    site.preprocess<{ lang?: string }>(options.extensions, function processSlugifyUrls(pages) {
      // Slugify the page URLs
      pages.forEach((page) => {
        const [url, ext] = getPathAndExtension(page.data.url);
        page.data.url = slugify(url, page.data.lang) + ext;
        page.data.basename = getBasename(page.data.url);
      });

      // Slugify the static files
      (site.files as StaticFile<{ lang?: string }>[])
        .filter((file) => matchExtension(options.extensions, file.outputPath))
        .forEach((file) => {
          const [url, ext] = getPathAndExtension(file.data.url);
          file.data.url = slugify(url, file.data.lang) + ext;
          file.data.basename = getBasename(file.data.url);
        });
    });
  };
}

export default slugifyUrls;

/** Extends Helpers interface */
declare global {
  namespace Lume {
    export interface Helpers {
      /** @see https://lume.land/plugins/slugify_urls/ */
      slugify: (string: string) => string;
    }
  }
}
