import { join, normalize } from "../deps/path.js";

export default function (site) {
  return function (path, absolute) {
    try {
      return new URL(path).toString();
    } catch (err) {
      if (!site.options.location) {
        return normalize(join("/", path));
      }

      path = normalize(join(site.options.location.pathname, path));

      return absolute ? site.options.location.origin + path : path;
    }
  };
}
