import { merge } from "@lumeland/core/utils/object.ts";
import { concurrent } from "@lumeland/core/utils/concurrent.ts";
import { render } from "../deps/pele.ts";

import type Site from "@lumeland/core/site.ts";
import type { Page } from "@lumeland/core/file.ts";
import { log } from "@lumeland/core/utils/log.ts";
import { RenderOptions, TextMeasurer } from "../deps/pele.ts";

export interface Options {
  selector?: string;
  options?: RenderOptions;
  monospace?: boolean | number;
}

export const defaults = {
  selector: ".pele",
  options: {},
} satisfies Options;

export function pele(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  if (options.monospace) {
    options.options.measurer ??= createMonospaceMeasurer(
      typeof options.monospace === "boolean" ? 0.6 : options.monospace,
    );
    options.options.fontFamily ??= "monospace";
    options.options.fontFamilyMono ??= "monospace";
  }

  return (site: Site) => {
    site.process([".html"], async function processMermaid(pages) {
      await concurrent(pages, processPage);
    });
  };

  async function processPage(page: Page) {
    for (const element of page.document.querySelectorAll(options.selector)) {
      try {
        const { svg } = render(element.textContent, options.options);
        if (element.matches("pre > code")) {
          element.parentElement!.outerHTML = svg;
        } else {
          element.innerHTML = svg;
        }
      } catch (err) {
        log.error(`[pele plugin] Error in ${page.sourcePath}: ${(err as Error).message}`);
      }
    }
  }
}

export default pele;

function createMonospaceMeasurer(advance = 0.6): TextMeasurer {
  return {
    width(text: string, size: number, style: number) {
      const effectiveSize = style & (8 | 16) ? size / 1.2 : size;
      return Array.from(text).length * advance * effectiveSize;
    },
  };
}
