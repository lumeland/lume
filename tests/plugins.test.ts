import { assertEquals as equals } from "../deps/assert.ts";
import { pluginNames } from "../core/utils/lume_config.ts";

const totalPlugins = Array.from(Deno.readDirSync("plugins")).length;

Deno.test("Plugins list in init", () => {
  equals(pluginNames.length, totalPlugins - 8);

  equals(pluginNames, [
    "attributes",
    "base_path",
    "code_highlight",
    "date",
    "decap_cms",
    "esbuild",
    "eta",
    "favicon",
    "feed",
    "fff",
    "filter_pages",
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
    "nunjucks",
    "on_demand",
    "pagefind",
    "picture",
    "postcss",
    "prism",
    "pug",
    "reading_info",
    "redirects",
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
    "transform_images",
    "toml",
    "unocss",
  ]);
});
