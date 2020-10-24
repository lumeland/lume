import yaml from "../loaders/yaml.js";

export default function () {
  return (site) => {
    site.loadData([".yml", ".yaml"], yaml);
    site.loadPages([".yml", ".yaml"], yaml);
  };
}
