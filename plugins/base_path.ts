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
 * A plugin to prepend a base path to all internal URLs
 * @see https://lume.land/plugins/base_path/
 */
export function basePath(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.use(modifyUrls({
      extensions: options.extensions,
      fn: (url) => url.startsWith("/") ? site.url(url) : url,
    }));
  };
}

export default basePath;
