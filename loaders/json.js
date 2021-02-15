export default function (path, source) {
  return source.readFile(path, (content) => JSON.parse(content));
}
