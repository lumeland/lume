import Site from "./site.js";

import attr from "./plugins/attributes.js";
import url from "./plugins/url.js";
import json from "./plugins/json.js";
import markdown from "./plugins/markdown.js";
import modules from "./plugins/modules.js";
import nunjucks from "./plugins/nunjucks.js";
import search from "./plugins/search.js";
import yaml from "./plugins/yaml.js";
import { merge } from "./utils.ts";

export const overrides = {};

export default function (options = {}, pluginOptions = {}) {
  options = merge(options, overrides);

  const site = new Site(options);

  return site
    .ignore("node_modules")
    .use(attr(pluginOptions.attr))
    .use(url(pluginOptions.url))
    .use(json(pluginOptions.json))
    .use(markdown(pluginOptions.markdown))
    .use(modules(pluginOptions.modules))
    .use(nunjucks(pluginOptions.nunjucks))
    .use(search(pluginOptions.search))
    .use(yaml(pluginOptions.yaml));
}
