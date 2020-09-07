import Site from "./src/site.js";

import NunjuksEngine from "./src/engines/nunjuks.js";
// import JsxEngine from "./src/engines/jsx.js";
import ModuleEngine from "./src/engines/module.js";
import jsonLoader from "./src/formats/json.js";
import markdownLoader from "./src/formats/markdown.js";
import moduleLoader from "./src/formats/module.js";
import yamlLoader from "./src/formats/yaml.js";
import textLoader from "./src/formats/text.js";
import permalinkTransformer from "./src/transformers/permalink.js";
import postCssTransformer from "./src/transformers/postcss.js";
import bundlerTransformer from "./src/transformers/bundler.js";
import urlFilter from "./src/filters/url.js";
import markdownFilter from "./src/filters/markdown.js";
import dateFilter from "./src/filters/date.js";

const defaultOptions = {
  src: ".",
  dest: "_site",
  pathPrefix: "/",
  dev: true,
};

export default function (options = {}) {
  options = Object.assign({}, defaultOptions, options);

  return configureSite(new Site(options));
}

function configureSite(site) {
  //Template engines
  const nunjuksEngine = new NunjuksEngine(site);
  site.addEngine(".njk", nunjuksEngine);
  site.addEngine(".html", nunjuksEngine);

  const moduleEngine = new ModuleEngine(site);
  site.addEngine(".tmpl.js", moduleEngine);
  site.addEngine(".tmpl.ts", moduleEngine);

  // const jsxEngine = new JsxEngine(site);
  // site.addEngine(".jsx", jsxEngine);
  // site.addEngine(".tsx", jsxEngine);

  //Filters
  site.addFilter("url", urlFilter(site));
  site.addFilter("md", markdownFilter());
  site.addFilter("date", dateFilter());

  //Data + Page + Assets loaders
  site.loadAssets(".css", textLoader);
  site.loadAssets(".ts", textLoader);
  site.loadAssets(".js", textLoader);

  site.loadData(".json", jsonLoader);
  site.loadPages(".tmpl.json", jsonLoader);

  site.loadData(".md", markdownLoader);
  site.loadData(".markdown", markdownLoader);
  site.loadPages(".md", markdownLoader);
  site.loadPages(".markdown", markdownLoader);

  site.loadData(".js", moduleLoader);
  site.loadData(".ts", moduleLoader);
  site.loadPages(".tmpl.js", moduleLoader);
  site.loadPages(".tmpl.ts", moduleLoader);

  site.loadData(".yml", yamlLoader);
  site.loadData(".yaml", yamlLoader);

  //Page transformers
  site.addTransformer("before", permalinkTransformer);
  site.addTransformer("after", postCssTransformer);
  site.addTransformer("after", bundlerTransformer);

  return site;
}
