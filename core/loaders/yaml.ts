import { parse } from "../../deps/yaml.ts";
import { isPlainObject } from "../utils.ts";

import type { Data } from "../../core.ts";

/** Load and parse a YAML file */
export default async function (path: string): Promise<Data> {
  const text = await Deno.readTextFile(path);
  const content = parse(text);

  if (!content) {
    return {};
  }

  if (isPlainObject(content)) {
    return content as Data;
  }

  return { content };
}

/** Parse the front matter from any text content */
export function parseFrontMatter(content: string): Data {
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
