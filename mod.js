import Site from "./site.js";
import { cache } from "./utils.js";

import attr from "./filters/attributes.js";
import url from "./plugins/url.js";
import json from "./plugins/json.js";
import markdown from "./plugins/markdown.js";
import modules from "./plugins/modules.js";
import nunjucks from "./plugins/nunjucks.js";
import search from "./plugins/search.js";
import yaml from "./plugins/yaml.js";

export default function (options = {}) {
  const site = new Site(options);

  //Update cache on update
  site.addEventListener("beforeUpdate", (ev) => {
    for (const filename of ev.files) {
      cache.delete(site.src(filename));
    }
  });

  return site
    .filter("attr", attr())
    .ignore("node_modules")
    .use(url())
    .use(json())
    .use(markdown())
    .use(modules())
    .use(nunjucks())
    .use(search())
    .use(yaml());
}
