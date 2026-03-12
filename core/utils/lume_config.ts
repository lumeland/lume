import { toFileUrl } from "../../deps/path.ts";
import { isUrl } from "./path.ts";

/** A list of the available plugins not installed by default and sorted */
export const pluginNames = [
  // Order doesn't matter, but should be first
  "attributes",
  "date",
  "code_highlight",
  "decap_cms",
  "fff",
  "eta",
  "extract_date",
  "extract_order",
  "jsx",
  "json_ld",
  "reading_info",
  "relations",
  "lume_cms",
  "mdx",
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
  "icons",
  "partytown",
  "replace",

  // CSS + JS + source maps
  "esbuild",
  "terser",
  "katex",
  "google_fonts",
  "sass",
  "unocss",
  "tailwindcss",
  "postcss",
  "lightningcss",
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
  "image_size",

  // Assets in HTML
  "metas",
  "inline",
  "sri",
  "validate_html",

  // Generate files with URLs
  "feed",
  "sitemap",
  "seo",

  // Final minification and compression
  "minify_html",
  "epub",
  "brotli",
  "gzip",
];

/** Resolve a configuration file */
export async function resolveConfigFile(
  defaultPaths: string[],
  customPath?: string,
): Promise<URL | undefined> {
  if (customPath) {
    if (isUrl(customPath)) {
      return new URL(customPath);
    }

    try {
      const file = await Deno.realPath(customPath);
      return toFileUrl(file);
    } catch {
      throw new Error(`Config file not found (${customPath})`);
    }
  }

  for (const path of defaultPaths) {
    try {
      const file = await Deno.realPath(path);
      return toFileUrl(file);
    } catch {
      // Ignore
    }
  }
}
