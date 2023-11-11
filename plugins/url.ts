import { merge } from "../core/utils.ts";

import type Site from "../core/site.ts";

export interface Options {
  /** The url helper name */
  names?: {
    url?: string;
    htmlUrl?: string;
  };
}

export const defaults: Options = {
  names: {
    url: "url",
    htmlUrl: "htmlUrl",
  },
};

/**
 * A plugin to register the filters "url" and "htmlUrl"
 * for normalizing URLs in the templates
 */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.filter(options.names.url!, url);
    site.filter(options.names.htmlUrl!, htmlUrl);

    function url(path = "/", absolute = false): string {
      return typeof path === "string" ? site.url(path, absolute) : path;
    }

    function htmlUrl(html = "", absolute = false): string {
      return html.replaceAll(
        /\s(href|src)="([^"]+)"/g,
        (_match, attr, value) => ` ${attr}="${url(value, absolute)}"`,
      );
    }
  };
}

/** Extends PageHelpers interface */
declare global {
  namespace Lume {
    export interface PageHelpers {
      /** @see https://lume.land/plugins/url/#url-filter */
      url: (path: string, absolute?: boolean) => string;

      /** @see https://lume.land/plugins/url/#htmlurl-filter */
      htmlUrl: (html: string, absolute?: boolean) => string;
    }
  }
}
