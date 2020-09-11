import Site from "./src/site.js";

import url from "./src/filters/url.js";
import date from "./src/filters/date.js";
import json from "./src/plugins/json.js";
import markdown from "./src/plugins/markdown.js";
import modules from "./src/plugins/modules.js";
import nunjucks from "./src/plugins/nunjucks.js";
import yaml from "./src/plugins/yaml.js";

const defaultOptions = {
  src: ".",
  dest: "_site",
  pathPrefix: "/",
  dev: true,
};

export default function (options = {}) {
  options = Object.assign({}, defaultOptions, options);

  //Default configuration
  const site = new Site(options);

  return site
    .filter("url", url(site))
    .filter("date", date())
    .use(json())
    .use(markdown())
    .use(modules())
    .use(nunjucks())
    .use(yaml());
}
