import { join, normalize } from "../deps/path.js";

export default function (site) {
  return function (url, absolute) {
    try {
      return new URL(url).toString();
    } catch (err) {
      url = normalize(join(site.options.pathPrefix, url));

      return absolute ? site.options.url + url : url;
    }
  };
}
