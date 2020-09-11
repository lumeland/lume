import yaml from "../loaders/yaml.js";
import permalink from "../transformers/permalink.js";

export default function () {
  return (site) => {
    site.load([".yml", ".yaml"], yaml);
    site.data([".yml", ".yaml"], yaml);
    site.beforeRender([".yml", ".yaml"], permalink);
  };
}
