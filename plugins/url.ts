import type Site from "../core/site.ts";

/**
 * A plugin to register the filters "url" and "htmlUrl"
 * for normalizing URLs in the templates
 * Installed by default
 * @see https://lume.land/plugins/url/
 */
export function url() {
  return (site: Site) => {
    site.filter("url", url);
    site.filter("htmlUrl", htmlUrl);

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

export default url;

/** Extends Helpers interface */
declare global {
  namespace Lume {
    export interface Helpers {
      /** @see https://lume.land/plugins/url/#url-filter */
      url: (path: string, absolute?: boolean) => string;

      /** @see https://lume.land/plugins/url/#htmlurl-filter */
      htmlUrl: (html: string, absolute?: boolean) => string;
    }
  }
}
