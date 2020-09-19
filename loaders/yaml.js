import { parse } from "../deps/yaml.js";

export default async function (path) {
  const content = await Deno.readTextFile(path);

  return parse(content);
}

export function parseFrontmatter(content) {
  if (content.startsWith("---")) {
    const frontMatter = [];
    const lines = content.split(/\r?\n/);
    lines.shift();

    while (lines[0] && !lines[0].startsWith("---")) {
      frontMatter.push(lines.shift());
    }
    lines.shift();

    const data = parse(frontMatter.join("\n"));
    data.content = lines.join("\n");
    return data;
  }

  return { content };
}
