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
    const candidates: string[] = [];
    let content: ChangedContent[] = [];

    site.process([".html", ".js"], (pages) => {
      for (const page of pages) {
        const file = page.outputPath;
        content.push({
          content: page.text,
          extension: file.endsWith(".html") ? ".html" : ".js",
        });
      }
    });

    site.process([".css"], async (files) => {
      if (files.length === 0) {
        log.info(
          "[tailwindcss plugin] No CSS files found. Make sure to add the CSS files with <gray>site.add()</gray>",
        );
        content = [];
        return;
      }

      candidates.push(...scanner.scanFiles(content));
      content = [];

      for (const file of files) {
        const compiler = await compile(file.text, {
          base: posix.dirname(file.outputPath),
          async loadModule(id, base, resourceHint) {
            if (id.startsWith(".")) {
              id = site.root(base, id);
              const mod = await import(id);
              return {
                base,
                module: mod.default,
              };
            }
            if (resourceHint === "plugin") {
              const mod = await import(`npm:${id}`);
              return {
                base,
                module: mod.default,
              };
            }
            throw new Error(`Cannot resolve module '${id}'`);
          },
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
