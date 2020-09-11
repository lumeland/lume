import JsxEngine from "../engines/jsx.js";
import permalink from "../transformers/permalink.js";

export default function () {
  return (site) => {
    const jsxEngine = new JsxEngine(site);

    site.addEngine([".jsx", ".tsx"], jsxEngine);
    site.beforeRender([".jsx", ".tsx"], permalink);
  };
}
