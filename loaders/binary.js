export default async function (path, source) {
  return { content: await source.readBinaryFile(path) };
}
