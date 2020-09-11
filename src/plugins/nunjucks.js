import NunjuksEngine from "../engines/nunjuks.js";
import permalink from "../transformers/permalink.js";

export default function () {
  return (site) => {
    const nunjuksEngine = new NunjuksEngine(site);

    site.engine([".njk", ".html"], nunjuksEngine);
    site.beforeRender([".njk"], permalink);
  };
}
