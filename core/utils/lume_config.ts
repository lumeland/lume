/** A list of the available plugins not installed by default */
export const pluginNames = [
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
  "nunjucks",
  "decap_cms",
  "on_demand",
  "pagefind",
  "picture",
  "postcss",
  "prism",
  "pug",
  "reading_info",
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
  "unocss",
];

/** Returns the _config file of a site */
export async function getConfigFile(
  path?: string,
): Promise<string | undefined> {
  if (path) {
    try {
      return await Deno.realPath(path);
    } catch {
      throw new Error(`Config file not found (${path})`);
    }
  }

  const paths = ["_config.js", "_config.ts"];

  for (const path of paths) {
    try {
      return await Deno.realPath(path);
    } catch {
      // Ignore
    }
  }
}
