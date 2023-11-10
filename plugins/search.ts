import { merge } from "../core/utils.ts";

import type Site from "../core/site.ts";

export interface Options {
  /** The helper name */
  name?: string;
}

export const defaults: Options = {
  name: "search",
};

/** Register the plugin to enable the `search` helpers */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.data(options.name, site.searcher);
  };
}
