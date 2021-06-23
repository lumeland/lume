import Site from "../site.ts";
import { Helper } from "../types.ts";

export default function () {
  return (site: Site) => {
    site.filter("url", url as Helper);
    site.filter("htmlUrl", htmlUrl as Helper);

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
