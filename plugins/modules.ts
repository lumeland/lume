import Module from "../engines/module.ts";
import loader from "../loaders/module.ts";
import Site from "../site.ts";

export default function () {
  return (site: Site) => {
    site.loadPages([".tmpl.js", ".tmpl.ts"], loader, new Module(site));
    site.loadData([".js", ".ts"], loader);
  };
}
