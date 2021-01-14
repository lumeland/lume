import NunjuksEngine from "../engines/nunjuks.js";

export default function () {
  return (site) => {
    const nunjuksEngine = new NunjuksEngine(site);

    site.engine([".njk", ".html"], nunjuksEngine);
    site.filter("njk", filter);

    function filter(string, data = {}) {
      return nunjuksEngine.engine.renderString(string, data);
    }
  };
}
