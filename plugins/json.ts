import Site from "../site.ts";
import json from "../loaders/json.ts";

export default function () {
  return (site: Site) => {
    site.loadData([".json"], json);
    site.loadPages([".tmpl.json"], json);
  };
}
