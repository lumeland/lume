import { assertEquals as equals } from "../deps/assert.ts";
import * as plugins from "../plugins.ts";
import { pluginNames } from "../cli/utils.ts";

const allNames = Object.keys(plugins);
const totalPlugins = Array.from(Deno.readDirSync("plugins")).length;

Deno.test("Plugins module", () => {
  equals(allNames.length, totalPlugins);

  equals(allNames, [
    "attributes",
    "basePath",
    "bundler",
    "codeHighlight",
    "date",
    "esbuild",
    "eta",
    "imagick",
    "inline",
    "json",
    "jsx",
    "liquid",
    "markdown",
    "metas",
    "modifyUrls",
    "modules",
    "netlifyCMS",
    "nunjucks",
    "onDemand",
    "paginate",
    "parcelCss",
    "postcss",
    "pug",
    "relativeUrls",
    "resolveUrls",
    "sass",
    "search",
    "slugifyUrls",
    "svgo",
    "terser",
    "url",
    "yaml",
  ]);
});

Deno.test("Plugins list in init", () => {
  equals(pluginNames.length, totalPlugins - 8);

  equals(pluginNames, [
    "attributes",
    "base_path",
    "bundler",
    "code_highlight",
    "date",
    "esbuild",
    "eta",
    "imagick",
    "inline",
    "jsx",
    "liquid",
    "metas",
    "modify_urls",
    "netlify_cms",
    "on_demand",
    "parcel_css",
    "postcss",
    "pug",
    "relative_urls",
    "resolve_urls",
    "sass",
    "slugify_urls",
    "svgo",
    "terser",
  ]);
});
