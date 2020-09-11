import JsxEngine from "../engines/jsx.js";

export default function () {
  return (site) => {
    const jsxEngine = new JsxEngine(site);

    site.addEngine([".jsx", ".tsx"], jsxEngine);
  };
}
