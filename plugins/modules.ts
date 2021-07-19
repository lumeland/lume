import { Site } from "../core.ts";
import Module from "../core/engines/module.ts";
import loader from "../core/loaders/module.ts";

/** A plugin that allows to load JavaScript/TypeScript modules */
export default function () {
  return (site: Site) => {
    site.loadPages([".tmpl.js", ".tmpl.ts"], loader, new Module());
    site.loadData([".js", ".ts"], loader);
  };
}
