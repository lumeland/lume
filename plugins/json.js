import json from "../loaders/json.js";
import permalink from "../transformers/permalink.js";

export default function () {
  return (site) => {
    site.data([".json"], json);
    site.load([".json"], json);

    site.beforeRender([".tmpl.json"], permalink);
  };
}
