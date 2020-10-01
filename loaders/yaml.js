import { parse } from "../deps/yaml.js";

export default async function (path) {
  const content = await Deno.readTextFile(path);

  return parse(content);
}

export function parseFrontmatter(content) {
  if (content.startsWith("---")) {
    const end = content.indexOf("---", 3);

    if (end !== -1) {
      const data = parse(content.slice(3, end));
      data.content = content.slice(end + 3);
      return data;
    }
  }

  return { content };
}
