import { posix } from "../deps/path.ts";
import modifyUrls from "./modify_urls.ts";

import type Site from "../core/site.ts";

/**
 * A plugin to convert all internal URLs to relative
 * @see https://lume.land/plugins/relative_urls/
 */
export function relativeUrls() {
  return (site: Site) => {
    const basePath = site.options.location.pathname;

    site.use(modifyUrls({
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
