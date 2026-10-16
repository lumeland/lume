import { merge } from "@lumeland/core/utils/object.ts";
import { getLibFiles, partytownSnippet } from "../deps/partytown.ts";
import type { PartytownConfig } from "../deps/partytown.ts";
import type Site from "@lumeland/core/site.ts";

export interface Options {
  /**
   * Custom Partytown configuration
   * @see https://partytown.qwik.dev/configuration/
   */
  options?: PartytownConfig;
}

export const defaults = {
  options: {
    lib: "/~partytown/",
  },
} satisfies Options;

export function partytown(userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    const dest = options.options.lib!;
    const snippet = partytownSnippet({
      ...options.options,
      lib: site.url(dest),
    });

    const src = getLibFiles(options.options.debug);

    site.add(src, dest);
    site.process([".html"], function processPartytown(pages) {
      for (const page of pages) {
        const script = page.document.createElement("script");
        script.textContent = snippet;
        page.document.head.appendChild(script);
      }
    });
  };
}

export default partytown;
