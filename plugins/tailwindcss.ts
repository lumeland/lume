import { compile, Scanner, specifier } from "../deps/tailwindcss.ts";
import { merge } from "../core/utils/object.ts";
import { log, warnUntil } from "../core/utils/log.ts";
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
      const hasPages = warnUntil(
        "[tailwindcss plugin] No CSS files found. Make sure to add the CSS files with <code>site.add()</code>",
        files.length,
      );

      if (!hasPages) {
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
                path: id,
                module: mod.default,
              };
            }
            if (resourceHint === "plugin") {
              const mod = await import(`npm:${id}`);
              return {
                base,
                path: id,
                module: mod.default,
              };
            }
            log.fatal(`[tailwindcss plugin] Cannot resolve module '${id}'`);
            throw new Error(`Cannot resolve module '${id}'`);
          },
          async loadStylesheet(id, base) {
            if (id === "tailwindcss") {
              const path = `${specifier}/index.css`;
              const content = await readFile(path);
              return { content, path, base };
            }

            if (id.startsWith("tailwindcss/")) {
              const filename = id.replace("tailwindcss/", "");
              const path = `${specifier}/${filename}`;
              const content = await readFile(path);
              return { content, path, base };
            }

            if (options.includes === false) {
              if (!id.startsWith(".")) {
                log.fatal(`[tailwindcss plugin] Cannot resolve module '${id}'`);
                throw new Error(`Cannot resolve module '${id}'`);
              }
            }

            const path = resolveInclude(id, options.includes || "", base);
            const content = await site.getContent(path, false);

            if (content === undefined) {
              log.fatal(`[tailwindcss plugin] File ${path} not found`);
              throw new Error(`File ${path} not found`);
            }

            return { content, path, base: dirname(path) };
          },
        });

        file.text = compiler.build(candidates);
      }
    });
  };
}

export default tailwindCSS;
