import Site from "../site.ts";
import json from "../loaders/json.ts";

/**
 * This plugin adds support for json
 */
export default function () {
  return (site: Site) => {
    site.loadData([".json"], json);
    site.loadPages([".tmpl.json"], json);
  };
}
