import { assertEquals as equals } from "../deps/assert.ts";
import { pluginNames } from "../cli/utils.ts";

const totalPlugins = Array.from(Deno.readDirSync("plugins")).length;

Deno.test("Plugins list in init", () => {
  equals(pluginNames.length, totalPlugins - 8);

  equals(pluginNames, [
    "attributes",
    "base_path",
    "code_highlight",
    "date",
    "esbuild",
    "eta",
    "imagick",
    "inline",
    "jsx",
    "jsx_preact",
    "katex",
    "lightningcss",
    "liquid",
    "metas",
    "minify_html",
    "modify_urls",
    "multilanguage",
    "netlify_cms",
    "on_demand",
    "pagefind",
    "postcss",
    "prism",
    "pug",
    "relations",
    "relative_urls",
    "remark",
    "resolve_urls",
    "sass",
    "sheets",
    "slugify_urls",
    "svgo",
    "terser",
    "windi_css",
  ]);
});
