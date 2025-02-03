import { compile, Scanner, specifier } from "../deps/tailwindcss.ts";
import { merge } from "../core/utils/object.ts";
import { log } from "../core/utils/log.ts";
import { dirname, posix } from "../deps/path.ts";
import { readFile } from "../core/utils/read.ts";

import type Site from "../core/site.ts";
import { ChangedContent } from "npm:@tailwindcss/oxide@4.0.3";
import { resolveInclude } from "../core/utils/path.ts";

export interface Options {
  /**
   * Custom includes path
   * @default `site.options.includes`
   */
  includes?: string | false;
}

export const defaults: Options = {};

/**
 * A plugin to extract the utility classes from HTML pages and apply TailwindCSS
 * @see https://lume.land/plugins/tailwindcss/
 */
export function tailwindCSS(userOptions?: Options) {
  return (site: Site) => {
    const options = merge<Options>(
      { ...defaults, includes: site.options.includes },
      userOptions,
    );
    const scanner = new Scanner({});
    const content: ChangedContent[] = [];

    site.addEventListener(
      "beforeUpdate",
      () => content.splice(0, content.length),
    );

    site.process([".html"], (files) => {
      for (const file of files) {
        content.push({
          content: file.text,
          file: file.outputPath,
          extension: ".html",
        });
      }
    });

    site.process([".js"], (files) => {
      for (const file of files) {
        content.push({
          content: file.text,
          file: file.outputPath,
          extension: ".js",
        });
      }
    });

    site.process([".css"], async (files) => {
      if (files.length === 0) {
        log.info(
          "[tailwindcss plugin] No CSS files found. Make sure to add the CSS files with <gray>site.add()</gray>",
        );
        return;
      }

      const candidates = scanner.scanFiles(content);

      for (const file of files) {
        const compiler = await compile(file.text, {
          base: posix.dirname(file.outputPath),
          async loadStylesheet(id, base) {
            if (id === "tailwindcss") {
              const url = `${specifier}/index.css`;
              const content = await readFile(url);
              return { content, base };
            }

            if (id.startsWith("tailwindcss/")) {
              const filename = id.replace("tailwindcss/", "");
              const url = `${specifier}/${filename}`;
              const content = await readFile(url);
              return { content, base };
            }

            if (options.includes === false) {
              if (!id.startsWith(".")) {
                throw new Error(`Cannot resolve module '${id}'`);
              }
            }

            const filename = resolveInclude(id, options.includes || "", base);
            const content = await site.getContent(filename, false);

            if (content === undefined) {
              throw new Error(`File ${file} not found`);
            }

            return { content, base: dirname(filename) };
          },
        });

        file.text = compiler.build(candidates);
      }
    });
  };
}

export default tailwindCSS;
