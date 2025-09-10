import { minify } from "../deps/minify_html.ts";
import { merge } from "../core/utils/object.ts";
import { log } from "../core/utils/log.ts";
import { bytes, percentage } from "../core/utils/format.ts";

import type { Options as MinifyOptions } from "../deps/minify_html.ts";
import type Site from "../core/site.ts";

export interface Options {
  /** File extensions to minify */
  extensions?: Array<".html" | ".css" | ".js">;

  /** Default options for minify-html library */
  options?: MinifyOptions;
}

// Default options
export const defaults: Options = {
  extensions: [".html"],
  options: {
    do_not_minify_doctype: true,
    ensure_spec_compliant_unquoted_attribute_values: true,
    keep_closing_tags: false,
    keep_html_and_head_opening_tags: false,
    keep_spaces_between_attributes: true,
    keep_comments: false,
    remove_bangs: false,
    remove_processing_instructions: false,
  },
};

/**
 * A plugin to minify HTML, CSS & JavaScript files
 * @see https://lume.land/plugins/minify_html/
 */
export function minifyHTML(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  const { extensions } = options;

  // Validate supported file extensions
  if (extensions.some((ext) => ![".html", ".css", ".js"].includes(ext))) {
    throw new Error(
      `Unsupported extensions configuration: ${
        extensions.join(", ")
      }. Only ".html", ".css" and ".js" are supported by minify-html plugin.`,
    );
  }

  options.options.minify_css ??= options.extensions?.includes(".css");
  options.options.minify_js ??= options.extensions?.includes(".js");

  return (site: Site) => {
    site.process(options.extensions, function processMinifyHTML(pages) {
      const item = site.debugBar?.buildItem(
        "[minify_html plugin] Minification completed",
      );

      for (const page of pages) {
        try {
          const content = page.bytes;
          page.bytes = minify(content, options.options) as Uint8Array<
            ArrayBuffer
          >;
          if (item) {
            item.items ??= [];
            const old = content.length;
            const minified = page.bytes.length;

            item.items.push({
              title: `[${percentage(old, minified)}] ${page.data.url}`,
              details: `${bytes(page.bytes.length)}`,
            });
          }
        } catch (error) {
          log.error(
            `[minify-html plugin] Error minifying ${page.sourcePath}: ${error}`,
          );
        }
      }
    });
  };
}

export default minifyHTML;
