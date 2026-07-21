import { merge } from "../core/utils/object.ts";
import { lib, partytownSnippet } from "../deps/partytown.ts";
import type { PartytownConfig } from "../deps/partytown.ts";
import type Site from "../core/site.ts";

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

  return <D>(site: Site<D>) => {
    const dest = options.options.lib!;
    const snippet = partytownSnippet({
      ...options.options,
      lib: site.url(dest),
    });

    const src = options.options.debug ? `${lib}/**/*.js` : `${lib}/*.js`;

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
