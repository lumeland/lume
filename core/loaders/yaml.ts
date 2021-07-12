import { Data } from "../../core.ts";
import { parse } from "../../deps/yaml.ts";

/** Load and parse YAML files */
export default async function (path: string): Promise<Data> {
  const content = await Deno.readTextFile(path);
  return parse(content) as Data;
}

/**
 * A helper to extract and parse the front matter
 * from any text content
 */
export function parseFrontmatter(content: string): Data {
  if (content.startsWith("---") && content.charAt(3) !== "-") {
    const end = content.indexOf("---", 3);

    if (end !== -1) {
      let data = parse(content.slice(3, end)) as Data | undefined;

      // Allow empty front matter
      if (!data) {
        data = {};
      }

      content = content.slice(end + 3) as string;

      if (content[0] === "\r") {
        content = content.slice(1);
      }

      if (content[0] === "\n") {
        content = content.slice(1);
      }

      data.content = content;
      return data;
    }
  }

  return { content };
}
