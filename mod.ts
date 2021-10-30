import { parse } from "./deps/flags.ts";
import { resolve } from "./deps/path.ts";
import Site from "./core/site.ts";

import url from "./plugins/url.ts";
import json, { Options as JsonOptions } from "./plugins/json.ts";
import markdown, { Options as MarkdownOptions } from "./plugins/markdown.ts";
import modules, { Options as ModulesOptions } from "./plugins/modules.ts";
import nunjucks, { Options as NunjucksOptions } from "./plugins/nunjucks.ts";
import search, { Options as SearchOptions } from "./plugins/search.ts";
import paginate, { Options as PaginateOptions } from "./plugins/paginate.ts";
import yaml, { Options as YamlOptions } from "./plugins/yaml.ts";
import { merge } from "./core/utils.ts";

import { ServerOptions, SiteOptions, WatcherOptions } from "./core.ts";

interface PluginOptions {
  json?: Partial<JsonOptions>;
  markdown?: Partial<MarkdownOptions>;
  modules?: Partial<ModulesOptions>;
  nunjucks?: Partial<NunjucksOptions>;
  search?: Partial<SearchOptions>;
  paginate?: Partial<PaginateOptions>;
  yaml?: Partial<YamlOptions>;
}

interface Options extends Omit<Partial<SiteOptions>, "server" | "watcher"> {
  server?: Partial<ServerOptions>;
  watcher?: Partial<WatcherOptions>;
}

export default function (
  options: Options = {},
  pluginOptions: PluginOptions = {},
  cliOptions = true,
) {
  if (cliOptions) {
    options = merge(options, getOptionsFromCli());
  }

  const site = new Site(options as Partial<SiteOptions>);

  return site
    .ignore("node_modules")
    .use(url())
    .use(json(pluginOptions.json))
    .use(markdown(pluginOptions.markdown))
    .use(modules(pluginOptions.modules))
    .use(nunjucks(pluginOptions.nunjucks))
    .use(paginate(pluginOptions.paginate))
    .use(search(pluginOptions.search))
    .use(yaml(pluginOptions.yaml));
}

function getOptionsFromCli(): Partial<Options> {
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

  const overrides: Partial<Options> = {};

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
