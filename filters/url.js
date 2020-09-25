export default function (site) {
  return function (path, absolute) {
    return site.url(path, absolute);
  };
}
