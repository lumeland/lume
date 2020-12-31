import Module from "../engines/module.js";
import { default as loader, removeCache } from "../loaders/module.js";

export default function () {
  return (site) => {
    site.engine([".tmpl.js", ".tmpl.ts"], new Module(site));
    site.loadData([".js", ".ts"], loader);

    //Update cache
    site.addEventListener("beforeUpdate", (ev) => {
      for (const filename of ev.files) {
        removeCache(site.src(filename));
      }
    });
  };
}
