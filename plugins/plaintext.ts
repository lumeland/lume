import { plainText } from "../deps/remove-markdown.ts";

import type { RemoveMarkdownOptions } from "../deps/remove-markdown.ts";
import type Site from "../core/site.ts";

export interface Options extends RemoveMarkdownOptions {
}

export const defaults: Options = {
  stripListLeaders: true,
  gfm: true,
  useImgAltText: true,
  replaceLinksWithURL: false,
};

/**
 * Plugin to convert a markdown or HTML string to plain text
 * @see https://lume.land/plugins/plaintext/
 */
export function plaintext(userOptions?: Options) {
  const options = { ...defaults, ...userOptions };

  return (site: Site) => {
    site.filter("plaintext", (text?: unknown, opts?: Options) => {
      if (typeof text === "string") {
        return plainText(text, opts || options);
      }

      return text;
    });
  };
}

export default plaintext;

/** Extends Helpers interface */
declare global {
  namespace Lume {
    export interface Helpers {
      /** @see https://lume.land/plugins/plaintext/ */
      plaintext: <T>(text?: T, options?: Options) => T;
    }
  }
}
