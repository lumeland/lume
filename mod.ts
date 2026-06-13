import Site from "./core/site.ts";
import url from "./plugins/url.ts";
import json, { Options as JsonOptions } from "./plugins/json.ts";
import markdown, { Options as MarkdownOptions } from "./plugins/markdown.ts";
import modules, { Options as ModulesOptions } from "./plugins/modules.ts";
import vento, { Options as VentoOptions } from "./plugins/vento.ts";
import search, { SearchPluginData } from "./plugins/search.ts";
import paginate, {
  Options as PaginateOptions,
  PaginatePluginData,
} from "./plugins/paginate.ts";
import toml, { Options as TomlOptions } from "./plugins/toml.ts";
import yaml, { Options as YamlOptions } from "./plugins/yaml.ts";
import { getOptionsFromCli } from "./core/utils/cli_options.ts";

import type { SiteOptions } from "./core/site.ts";
import { Data } from "./core/file.ts";

export interface PluginOptions {
  json?: JsonOptions;
  markdown?: MarkdownOptions;
  modules?: ModulesOptions;
  vento?: VentoOptions;
  paginate?: PaginateOptions;
  toml?: TomlOptions;
  yaml?: YamlOptions;
}

export default function lume<T extends Data = Lume.Data>(
  options: SiteOptions = {},
  pluginOptions: PluginOptions = {},
  cliOptions = true,
): Site<T & PaginatePluginData & SearchPluginData> {
  if (cliOptions) {
    getOptionsFromCli(options);
  }

  const site = new Site<T>(options);

  // Ignore some files by the watcher
  site.options.watcher.ignore.push("/deno.lock");
  site.options.watcher.ignore.push("/deno.json");
  site.options.watcher.ignore.push("/deno.jsonc");
  site.options.watcher.ignore.push("/node_modules/.deno");
  site.options.watcher.ignore.push("/.git");
  site.options.watcher.ignore.push("/_cache");
  site.options.watcher.ignore.push((path) => path.endsWith("/.DS_Store"));

  return site
    .ignore("node_modules")
    .ignore("import_map.json")
    .ignore("deno.json")
    .ignore("deno.jsonc")
    .ignore("deno.lock")
    .ignore((path) => path.endsWith(".d.ts"))
    .mergeKey("tags", "stringArray")
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
