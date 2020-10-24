import Module from "../engines/module.js";
import loader from "../loaders/module.js";

export default function () {
  return (site) => {
    site.engine([".tmpl.js", ".tmpl.ts"], new Module(site));
    site.loadData([".js", ".ts"], loader);
  };
}
