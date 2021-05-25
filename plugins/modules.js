import Module from "../engines/module.js";
import loader from "../loaders/module.js";

export default function () {
  return (site) => {
    site.loadPages([".tmpl.js", ".tmpl.ts"], loader, new Module(site));
    site.loadData([".js", ".ts"], loader);
  };
}
