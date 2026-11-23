import { merge } from "@lumeland/core/utils/object.ts";
import { concurrent } from "@lumeland/core/utils/concurrent.ts";
import { render } from "../deps/pele.ts";

import type Site from "@lumeland/core/site.ts";
import type { Page } from "@lumeland/core/file.ts";
import { log } from "@lumeland/core/utils/log.ts";

export interface Options {
  selector?: string;
}

export const defaults = {
  selector: ".pele",
} satisfies Options;

export function pele(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.process([".html"], async function processMermaid(pages) {
      await concurrent(pages, processPage);
    });
  };

  async function processPage(page: Page) {
    for (const element of page.document.querySelectorAll(options.selector)) {
      try {
        const { svg } = render(element.textContent);
        element.outerHTML = svg;
      } catch (err) {
        log.error(`[pele plugin] Error in ${page.sourcePath}: ${(err as Error).message}`);
      }
    }
  }
}

export default pele;
