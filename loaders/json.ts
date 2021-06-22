export default async function (path) {
  const content = await Deno.readTextFile(path);
  return JSON.parse(content);
}
