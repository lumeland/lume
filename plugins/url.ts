import { Helper, Site } from "../core.ts";
import { merge } from "../core/utils.ts";

export interface Options {
  /** The url helper name */
  names: {
    url: string;
    htmlUrl: string;
  };
}

const defaults: Options = {
  names: {
    url: "url",
    htmlUrl: "htmlUrl",
  },
};

/**
 * A plugin to register the filters "url" and "htmlUrl"
 * for normalizing URLs in the templates
 */
export default function (userOptions?: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.filter(options.names.url, url as Helper);
    site.filter(options.names.htmlUrl, htmlUrl as Helper);

    function url(path = "/", absolute = false) {
      return typeof path === "string" ? site.url(path, absolute) : path;
    }

    function htmlUrl(html = "", absolute = false) {
      return html.replaceAll(
        /\s(href|src)="([^"]+)"/g,
        (_match, attr, value) => ` ${attr}="${url(value, absolute)}"`,
      );
    }
  };
}
