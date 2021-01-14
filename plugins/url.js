export default function () {
 return (site) => {
    site.filter("url", url);
    site.filter("htmlUrl", htmlUrl);

    function url (path = "/", absolute = false) {
      if (typeof path !== "string") {
        return path;
      }

      return site.url(path, absolute);
    }

    function htmlUrl (html = "", absolute = false) {
      return html.replaceAll(
        /\s(href|src)="([^"]+)"/g,
        (match, attr, value) => ` ${attr}="${url(value, absolute)}"`
      );
    }
  }
}