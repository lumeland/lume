import json from "../loaders/json.js";

export default function () {
  return (site) => {
    site.loadData([".json"], json);
    site.loadPages([".tmpl.json"], json);
  };
}
