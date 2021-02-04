import Site from "./site.js";

import attr from "./plugins/attributes.js";
import url from "./plugins/url.js";
import json from "./plugins/json.js";
import markdown from "./plugins/markdown.js";
import modules from "./plugins/modules.js";
import nunjucks from "./plugins/nunjucks.js";
import search from "./plugins/search.js";
import yaml from "./plugins/yaml.js";

export default function (options = {}) {
  const site = new Site(options);

  return site
    .ignore("node_modules")
    .use(attr())
    .use(url())
    .use(json())
    .use(markdown())
    .use(modules())
    .use(nunjucks())
    .use(search())
    .use(yaml());
}
