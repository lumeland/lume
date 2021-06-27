import { parse } from "./deps/flags.js";
import { resolve } from "./deps/path.js";
import Site from "./site.js";

import url from "./plugins/url.js";
import json from "./plugins/json.js";
import markdown from "./plugins/markdown.js";
import modules from "./plugins/modules.js";
import nunjucks from "./plugins/nunjucks.js";
import search from "./plugins/search.js";
import yaml from "./plugins/yaml.js";
import { merge } from "./utils.js";

export default function (options = {}, pluginOptions = {}) {
  options = merge(options, getOptionsFromCli());

  const site = new Site(options);

  return site
    .ignore("node_modules")
    .use(url(pluginOptions.url))
    .use(json(pluginOptions.json))
    .use(markdown(pluginOptions.markdown))
    .use(modules(pluginOptions.modules))
    .use(nunjucks(pluginOptions.nunjucks))
    .use(search(pluginOptions.search))
    .use(yaml(pluginOptions.yaml));
}

function getOptionsFromCli() {
  const options = parse(Deno.args, {
    string: [
      "root",
      "src",
      "dest",
      "location",
      "metrics",
      "verbose",
      "port",
    ],
    boolean: ["dev", "serve", "open"],
    alias: { dev: "d", serve: "s", port: "p", open: "o" },
    ["--"]: true,
  });

  const overrides = {};

  if (options.root) {
    overrides.cwd = resolve(Deno.cwd(), options.root);
  }

  if (options.src) {
    overrides.src = options.src;
  }

  if (options.dest) {
    overrides.dest = options.dest;
  }

  if (options.location) {
    overrides.location = new URL(options.location);
  } else if (options.serve) {
    overrides.location = new URL(`http://localhost:${options.port || 3000}/`);
  }

  if (options.dev) {
    overrides.dev = options.dev;
  }

  if ("metrics" in options) {
    overrides.metrics = options.metrics ? options.metrics : true;
  }

  if (options.verbose) {
    overrides.verbose = parseInt(options.verbose);
  }

  if (options.port) {
    (overrides.server ||= {}).port = parseInt(options.port);
  }

  if (options.open) {
    (overrides.server ||= {}).open = options.open;
  }

  if (options["--"]) {
    overrides.flags = options["--"];
  }

  return overrides;
}
