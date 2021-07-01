import { parse } from "./deps/flags.ts";
import { resolve } from "./deps/path.ts";
import Site from "./site.ts";

import url from "./plugins/url.js";
import json from "./plugins/json.js";
import markdown from "./plugins/markdown.js";
import modules from "./plugins/modules.js";
import nunjucks from "./plugins/nunjucks.js";
import search from "./plugins/search.js";
import yaml from "./plugins/yaml.js";
import { merge } from "./utils.ts";

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
      "port",
    ],
    boolean: ["quiet", "dev", "serve", "open"],
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

  if ("metrics" in options) {
    overrides.metrics = options.metrics || true;
  }

  if (options.quiet) {
    overrides.quiet = options.quiet;
  }

  if (options.dev) {
    overrides.dev = options.dev;
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
