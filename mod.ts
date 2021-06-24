import { parse } from "./deps/flags.ts";
import { resolve } from "./deps/path.ts";
import Site from "./site.ts";

import url from "./plugins/url.ts";
import json from "./plugins/json.ts";
import markdown from "./plugins/markdown.ts";
import modules from "./plugins/modules.ts";
import nunjucks from "./plugins/nunjucks.ts";
import search from "./plugins/search.ts";
import yaml from "./plugins/yaml.ts";
import { merge } from "./utils.ts";
import { SiteOptions } from "./types.ts";

export default function (
  options: Partial<SiteOptions> = {},
  pluginOptions: Record<string, Record<string, unknown>> = {},
): Site {
  options = merge(options, getOptionsFromCli());

  const site = new Site(options);

  return site
    .ignore("node_modules")
    .use(url())
    .use(json(pluginOptions.json))
    .use(markdown(pluginOptions.markdown))
    .use(modules(pluginOptions.modules))
    .use(nunjucks(pluginOptions.nunjucks))
    .use(search())
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

  const overrides: Partial<SiteOptions> = {};

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
    overrides.metrics = options.metrics !== "false";
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
