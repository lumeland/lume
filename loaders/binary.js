export default async function (path) {
  const content = await Deno.readFile(path);
  return { content };
}
