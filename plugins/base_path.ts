import modifyUrls from "./modify_urls.ts";

import type Site from "../core/site.ts";
import { Data } from "../core/file.ts";

/**
 * A plugin to prepend a base path to all internal URLs
 * @see https://lume.land/plugins/base_path/
 */
export function basePath() {
  return <D extends Data>(site: Site<D>) => {
    site.use(modifyUrls({
      fn: (url) => url.startsWith("/") ? site.url(url) : url,
    }));
  };
}

export default basePath;
