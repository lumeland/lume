import Module from "../engines/module.js";
import loader from "../loaders/module.js";
import permalink from "../transformers/permalink.js";

export default function () {
  return (site) => {
    site.engine([".tmpl.js", ".tmpl.ts"], new Module(site));
    site.data([".js", ".ts"], loader);

    site.beforeRender([".tmpl.js", ".tmpl.ts"], permalink);
  };
}
