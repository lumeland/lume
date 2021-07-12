import { Site } from "../core.ts";
import Module from "../core/engines/module.ts";
import loader from "../core/loaders/module.ts";

/** This plugin allows to load .ts and .js modules */
export default function () {
  return (site: Site) => {
    site.loadPages([".tmpl.js", ".tmpl.ts"], loader, new Module());
    site.loadData([".js", ".ts"], loader);
  };
}
