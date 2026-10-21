import "@lumeland/core/services/global.ts";
import Site from "@lumeland/core/site.ts";
import url from "@lumeland/plugin-url";
import json from "@lumeland/plugin-json";
import markdown from "@lumeland/plugin-markdown";
import modules from "@lumeland/plugin-modules";
import vento from "@lumeland/plugin-vento";
import search from "@lumeland/plugin-search";
import paginate from "@lumeland/plugin-paginate";
import toml from "@lumeland/plugin-toml";
import yaml from "@lumeland/plugin-yaml";
import { getOptionsFromCli } from "./utils/cli_options.ts";

import type { Options as JsonOptions } from "@lumeland/plugin-json";
import type { Options as MarkdownOptions } from "@lumeland/plugin-markdown";
import type { Options as ModulesOptions } from "@lumeland/plugin-modules";
import type { Options as VentoOptions } from "@lumeland/plugin-vento";
import type { Options as PaginateOptions } from "@lumeland/plugin-paginate";
import type { Options as TomlOptions } from "@lumeland/plugin-toml";
import type { Options as YamlOptions } from "@lumeland/plugin-yaml";
import type { SiteOptions } from "@lumeland/core/site.ts";

export interface PluginOptions {
  json?: JsonOptions;
  markdown?: MarkdownOptions;
  modules?: ModulesOptions;
  vento?: VentoOptions;
  paginate?: PaginateOptions;
  toml?: TomlOptions;
  yaml?: YamlOptions;
}

export default function lume(
  options: SiteOptions = {},
  pluginOptions: PluginOptions = {},
  cliOptions = true,
): Site {
  if (cliOptions) {
    getOptionsFromCli(options);
  }

  const site = new Site(options);

  const ignore = [
    "/deno.lock",
    "/deno.json",
    "/deno.jsonc",
    "/package.json",
    "/package-lock.json",
    "/pnpm-lock.yaml",
    "/pnpm-worksapce.yaml",
    "/tsconfig.json",
    "/node_modules",
    "/.git",
    "/_cache",
  ];

  // Ignore some files by the watcher
  site.options.watcher.ignore.push(...ignore);
  site.options.watcher.ignore.push((path) => path.endsWith("/.DS_Store"));

  return site
    .ignore(...ignore)
    .ignore((path) => path.endsWith(".d.ts"))
    .mergeKey("tags", "stringArray")
    .archetype("archetype", import.meta.resolve("./archetypes/archetype.ts"))
    .archetype("plugin", import.meta.resolve("./archetypes/plugin.ts"))
    .use(url())
    .use(json(pluginOptions.json))
    .use(markdown(pluginOptions.markdown))
    .use(modules(pluginOptions.modules))
    .use(vento(pluginOptions.vento))
    .use(paginate(pluginOptions.paginate))
    .use(search())
    .use(toml(pluginOptions.toml))
    .use(yaml(pluginOptions.yaml));
}
