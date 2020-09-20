import { join, normalize } from "../deps/path.js";

const defaultOptions = {
  pathPrefix: "/",
  url: "",
};

export default function (options) {
  options = { ...defaultOptions, ...options };

  return function (url, absolute) {
    try {
      return new URL(url).toString();
    } catch (err) {
      url = normalize(join(options.pathPrefix, url));

      return absolute ? options.url + url : url;
    }
  };
}
