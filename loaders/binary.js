export default async function (path, source) {
  return source.readFile(path, (content) => ({ content }), true);
}
