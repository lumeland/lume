/** A list of the available plugins not installed by default and sorted */
export const pluginNames = [
  // Order doesn't matter, but should be first
  "attributes",
  "toml",
  "date",
  "code_highlight",
  "decap_cms",
  "fff",
  "eta",
  "extract_date",
  "jsx",
  "json_ld",
  "reading_info",
  "relations",
  "mdx",
  "metas",
  "multilanguage",
  "nav",
  "nunjucks",
  "pagefind",
  "plaintext",
  "prism",
  "pug",
  "remark",
  "robots",
  "sheets",
  "filter_pages",
  "redirects",

  // CSS + JS + source maps
  "esbuild",
  "terser",
  "katex",
  "google_fonts",
  "sass",
  "lightningcss",
  "postcss",
  "tailwindcss",
  "unocss",
  "purgecss",
  "source_maps",

  // Modify URLs
  "base_path",
  "resolve_urls",
  "relative_urls",
  "slugify_urls",
  "modify_urls",
  "check_urls",

  // Images
  "og_images",
  "favicon",
  "svgo",
  "picture",
  "transform_images",

  // Assets in HTML
  "inline",
  "sri",

  // Generate files with URLs
  "feed",
  "sitemap",

  // Final minification and compression
  "minify_html",
  "brotli",
  "gzip",
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
