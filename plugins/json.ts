import json from "../loaders/json.ts";
import Site from "../site.ts";
import { merge } from "../utils.ts";
import { UserOptions } from "../types.ts";

type Options = {
  extensions: {
    data: string[],
    pages: string[],
  }
}

// Default options
const defaults: Options = {
  extensions: {
    data: [".json"],
    pages: [".tmpl.json"]
  }
};

export default function (userOptions: UserOptions<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadData(options.extensions.data, json);
    site.loadPages(options.extensions.pages, json);
  };
}
