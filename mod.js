import Site from "./site.js";

import url from "./filters/url.js";
import date from "./filters/date.js";
import json from "./plugins/json.js";
import markdown from "./plugins/markdown.js";
import modules from "./plugins/modules.js";
import nunjucks from "./plugins/nunjucks.js";
import yaml from "./plugins/yaml.js";

const defaultOptions = {
  src: ".",
  dest: "_site",
  pathPrefix: "/",
  dev: true,
};

export default function (options = {}) {
  options = { ...defaultOptions, ...options };

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
