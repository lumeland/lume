import yaml from "../loaders/yaml.js";

export default function () {
  return (site) => {
    site.load([".yml", ".yaml"], yaml);
    site.data([".yml", ".yaml"], yaml);
  };
}
