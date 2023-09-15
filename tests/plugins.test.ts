import { assertEquals as equals } from "../deps/assert.ts";
import { pluginNames } from "../core/utils.ts";

const totalPlugins = Array.from(Deno.readDirSync("plugins")).length;

Deno.test("Plugins list in init", () => {
  equals(pluginNames.length, totalPlugins - 9);

  equals(pluginNames, [
    "attributes",
    "base_path",
    "code_highlight",
    "date",
    "esbuild",
    "eta",
    "favicon",
    "feed",
    "filter_pages",
    "imagick",
    "inline",
    "jsx",
    "jsx_preact",
    "katex",
    "lightningcss",
    "liquid",
    "mdx",
    "metas",
    "minify_html",
    "modify_urls",
    "multilanguage",
    "nav",
    "netlify_cms",
    "on_demand",
    "pagefind",
    "picture",
    "postcss",
    "prism",
    "pug",
    "relations",
    "relative_urls",
    "remark",
    "resolve_urls",
    "sass",
    "sheets",
    "sitemap",
    "slugify_urls",
    "source_maps",
    "svgo",
    "tailwindcss",
    "terser",
    "toml",
    "vento",
    "windi_css",
  ]);
});
