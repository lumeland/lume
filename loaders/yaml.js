import { parse } from "../deps/yaml.ts";

export default async function (path) {
  const content = await Deno.readTextFile(path);
  return parse(content);
}

export function parseFrontmatter(content) {
  if (content.startsWith("---") && content.charAt(3) !== "-") {
    const end = content.indexOf("---", 3);

    if (end !== -1) {
      let data = parse(content.slice(3, end));

      // Allow empty front matter
      if (typeof data === "undefined") {
        data = {};
      }

      data.content = content.slice(end + 3);

      if (data.content[0] === "\r") {
        data.content = data.content.slice(1);
      }

      if (data.content[0] === "\n") {
        data.content = data.content.slice(1);
      }

      return data;
    }
  }

  return { content };
}
