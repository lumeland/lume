import { posix } from "../deps/path.ts";
import { merge } from "../core/utils/object.ts";
import modifyUrls from "./modify_urls.ts";

import type Site from "../core/site.ts";

export interface Options {
  /** The list of extensions this plugin applies to */
  extensions?: string[];
}

// Default options
export const defaults: Options = {
  extensions: [".html"],
};

/**
 * A plugin to convert all internal URLs to relative
 * @see https://lume.land/plugins/relative_urls/
 */
export function relativeUrls(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const basePath = site.options.location.pathname;

    site.use(modifyUrls({
      extensions: options.extensions,
      fn(url, page) {
        if (!url.startsWith("/") || url.startsWith("//")) {
          return url;
        }

        if (!url.startsWith(basePath)) {
          url = posix.join(basePath, url);
        }

        const from = site.url(page.outputPath);
        return posix.join(".", posix.relative(posix.dirname(from), url));
      },
    }));
  };
}

export default relativeUrls;
