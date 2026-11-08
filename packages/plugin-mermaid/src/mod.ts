import { merge } from "@lumeland/core/utils/object.ts";
import { concurrent } from "@lumeland/core/utils/concurrent.ts";
import { renderToSvg } from "../deps/mermaid.ts";

import type Site from "@lumeland/core/site.ts";
import type { Page } from "@lumeland/core/file.ts";
import { log } from "@lumeland/core/utils/log.ts";

export interface Options {
  selector?: string;
}

export const defaults = {
  selector: ".mermaid",
} satisfies Options;

export function mermaid(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process([".html"], async function processMermaid(pages) {
      await concurrent(pages, processPage);
    });
  };

  async function processPage(page: Page) {
    for (const element of page.document.querySelectorAll(options.selector)) {
      try {
        const { svg, warnings } = await renderToSvg(element.textContent);
        if (warnings.length) {
          log.warn(
            `[mermaid plugin] Warnings in ${page.sourcePath}`,
            warnings.map((warning) => ({
              title: warning.message,
            })),
          );
        }

        element.outerHTML = svg;
      } catch (err) {
        log.error(`[mermaid plugin] Error in ${page.sourcePath}: ${(err as Error).message}`);
      }
    }
  }
}
