import { Site } from "../core.ts";
import json from "../core/loaders/json.ts";

/** A plugin to add support for JSON files */
export default function () {
  return (site: Site) => {
    site.loadData([".json"], json);
    site.loadPages([".tmpl.json"], json);
  };
}
