import modifyUrls from "./modify_urls.ts";

import type Site from "../core/site.ts";

/** A plugin to prepend a base path to all internal URLs */
export default function () {
  return (site: Site) => {
    site.use(modifyUrls({
      fn: (url) => url.startsWith("/") ? site.url(url) : url,
    }));
  };
}
