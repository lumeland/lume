export default function (site) {
  return function (path = "/", absolute = false) {
    if (typeof path !== "string") {
      return path;
    }

    return site.url(path, absolute);
  };
}
