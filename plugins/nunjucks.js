import NunjuksEngine from "../engines/nunjuks.js";

export default function () {
  return (site) => {
    const nunjuksEngine = new NunjuksEngine(site);

    site.engine([".njk", ".html"], nunjuksEngine);
  };
}
