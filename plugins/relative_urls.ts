import { posix } from "../deps/path.ts";
import modifyUrls from "./modify_urls.ts";

import type { HelperThis } from "../core/renderer.ts";
import type Site from "../core/site.ts";

/**
 * A plugin to convert all internal URLs to relative
 * @see https://lume.land/plugins/relative_urls/
 */
export function relativeUrls() {
  return (site: Site) => {
    const basePath = site.options.location.pathname;

    function getRelativeUrl(url: string, from: string) {
      if (!url.startsWith("/") || url.startsWith("//")) {
        return url;
      }

      if (!url.startsWith(basePath)) {
        url = posix.join(basePath, url);
      }

      return posix.join(".", posix.relative(posix.dirname(from), url));
    }

    site.use(modifyUrls({
      fn: (url, page) => getRelativeUrl(url, site.url(page.outputPath)),
    }));

    site.filter(
      "relativeUrl",
      function (this: HelperThis | void, url: string, from?: string) {
        if (from?.endsWith("/")) {
          from += "index.html";
        } else {
          from ??= this?.data?.page.outputPath;
        }

        if (!from) {
          return url;
        }

        return getRelativeUrl(url, site.url(from));
      },
    );
  };
}

export default relativeUrls;

/** Extends Helpers interface */
declare global {
  namespace Lume {
    export interface Helpers {
      /** @see https://lume.land/plugins/relative_urls/ */
      relativeUrl: (
        this: HelperThis | void,
        url: string,
        from?: string,
      ) => string;
    }
  }
}
