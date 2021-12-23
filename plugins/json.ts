import json from "../core/loaders/json.ts";
import { merge } from "../core/utils.ts";

import type { Site } from "../core.ts";

export interface Options {
  /** The list of extensions used to load files */
  extensions: string[] | {
    pages: string[];
    data: string[];
  };
}

// Default options
const defaults: Options = {
  extensions: {
    data: [".json"],
    pages: [".tmpl.json"],
  },
};

/** A plugin to add support for JSON files */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);
  const extensions = Array.isArray(options.extensions)
    ? { pages: options.extensions, data: options.extensions }
    : options.extensions;

  return (site: Site) => {
    site.loadData(extensions.data, json);
    site.loadPages(extensions.pages, json);
  };
}
