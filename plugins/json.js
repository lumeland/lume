import json from "../loaders/json.js";

export default function () {
  return (site) => {
    site.data([".json"], json);
    site.load([".tmpl.json"], json);
  };
}
