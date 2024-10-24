/** A list of the available plugins not installed by default */
export const pluginNames = [
  "attributes",
  "base_path",
  "check_urls",
  "code_highlight",
  "date",
  "decap_cms",
  "esbuild",
  "eta",
  "favicon",
  "feed",
  "fff",
  "filter_pages",
  "google_fonts",
  "gzip",
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
  "og_images",
  "on_demand",
  "pagefind",
  "picture",
  "plugins",
  "postcss",
  "prism",
  "pug",
  "reading_info",
  "redirects",
  "relations",
  "relative_urls",
  "remark",
  "resolve_urls",
  "robots",
  "sass",
  "sheets",
  "sitemap",
  "slugify_urls",
  "source_maps",
  "sri",
  "svgo",
  "tailwindcss",
  "terser",
  "transform_images",
  "toml",
  "unocss",
];

/** Returns the _config file of a site */
export async function getConfigFile(
  path?: string,
  defaultPaths: string[] = ["_config.js", "_config.ts"],
): Promise<string | undefined> {
  if (path) {
    try {
      return await Deno.realPath(path);
    } catch {
      throw new Error(`Config file not found (${path})`);
    }
  }

  for (const path of defaultPaths) {
    try {
      return await Deno.realPath(path);
    } catch {
      // Ignore
    }
  }
}
