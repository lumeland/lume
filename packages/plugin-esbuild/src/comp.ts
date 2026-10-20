import { posix } from "../deps/path.ts";
import { build, stop } from "../deps/esbuild.ts";
import { log } from "@lumeland/core/utils/log.ts";
import text from "@lumeland/core/loaders/text.ts";

import type { Entry } from "@lumeland/core/fs.ts";

/** Function used by Lume to compile the JS of the components into a single file */
export async function compileComponentsJS(
  filename: string,
  imports: Map<string, string | Entry>,
  entries: Map<string, Entry>,
): Promise<string> {
  const mainCode = Array.from(imports.keys())
    .map((path) => `import "${path}";`)
    .join("\n");

  const { outputFiles } = await build({
    bundle: true,
    entryPoints: [filename],
    write: false,
    format: "esm",
    minify: false,
    target: "esnext",
    outfile: filename,

    plugins: [
      {
        name: "components-resolver",
        setup(build) {
          build.onResolve({ filter: /.*/ }, ({ path, importer }) => {
            if (path.startsWith(".")) {
              path = posix.join(posix.dirname(importer), path);
            }
            if (path === filename || imports.has(path) || entries.has(path)) {
              return { path, namespace: "fs" };
            }
            return { path, external: true };
          });

          build.onLoad({ filter: /.*/, namespace: "fs" }, async ({ path }) => {
            const contents =
              path === filename
                ? mainCode
                : await getEntryContent(imports.get(path) || entries.get(path));
            if (!contents) {
              log.error(`[components] File "${path}" not found or is empty`);
            }
            return {
              contents,
              loader: path.endsWith(".ts") ? "ts" : "js",
            };
          });
        },
      },
    ],
  });

  await stop();

  const decoder = new TextDecoder();
  return decoder.decode(outputFiles[0].contents);
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
