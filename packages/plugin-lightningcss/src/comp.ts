import { bundleAsync } from "../deps/lightningcss.ts";
import { posix } from "../deps/path.ts";
import { log } from "@lumeland/core/utils/log.ts";
import text from "@lumeland/core/loaders/text.ts";

import type { Entry } from "@lumeland/core/fs.ts";

const decoder = new TextDecoder();

/** Function used by Lume to compile the CSS of the components into a single file */
export async function compileComponentsCSS(
  filename: string,
  imports: Map<string, string | Entry>,
  entries: Map<string, Entry>,
): Promise<string> {
  const mainCode = Array.from(imports.keys())
    .map((path) => `@import "${path}";`)
    .join("\n");

  const { code } = await bundleAsync({
    filename,
    sourceMap: false,
    resolver: {
      resolve(id, importer) {
        if (id.startsWith(".")) {
          id = posix.join(posix.dirname(importer), id);
        }
        return id;
      },
      async read(filePath) {
        if (filePath === filename) {
          return mainCode;
        }
        const content = await getEntryContent(imports.get(filePath) || entries.get(filePath));
        if (!content) {
          log.error(`[components] File "${filePath}" not found or is empty`);
        }
        return content;
      },
    },
  });

  return decoder.decode(code);
}

async function getEntryContent(entry?: Entry | string): Promise<string> {
  if (typeof entry === "string") {
    return entry;
  }

  if (entry) {
    const { content } = await entry.getContent(text);
    return (content as string) || "";
  }

  return "";
}
