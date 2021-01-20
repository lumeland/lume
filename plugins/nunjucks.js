import NunjuksEngine from "../engines/nunjuks.js";
import { merge } from "../utils.js";

// default options
const defaults = {
  extensions: [".njk", ".html"],
};

export default function (userOptions) {
  const options = merge(defaults, userOptions);

  return (site) => {
    const nunjuksEngine = new NunjuksEngine(site);

    site.engine(options.extensions, nunjuksEngine);
    site.filter("njk", filter);

    function filter(string, data = {}) {
      return nunjuksEngine.engine.renderString(string, data);
    }
  };
}
