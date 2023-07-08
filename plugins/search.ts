import { merge } from "../core/utils.ts";

import { Site } from "../core.ts";

export interface Options {
  /** The helper name */
  name: string;
}

export const defaults: Options = {
  name: "search",
};

/** Register the plugin to enable the `search` helpers */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.data(options.name, site.searcher);
  };
}
