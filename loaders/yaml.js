import { parse } from "../deps/yaml.js";

export default async function (path) {
  const content = await Deno.readTextFile(path);

  return parse(content);
}

export function parseFrontmatter(content) {
  if (content.startsWith("---")) {
    const pieces = content.split(/^---\s*$/gm, 3);

    if (pieces.length === 3) {
      const data = parse(pieces[1]);
      data.content = pieces[2];
      return data;
    }
  }

  return { content };
}
