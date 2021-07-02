import { encode } from "./deps/base64.ts";
import { posix } from "./deps/path.ts";

const { join } = posix;
const baseUrl = new URL(".", import.meta.url).href;
const imports = {
  "lume/": join(baseUrl, "/"),
  "lume/plugins/attributes.js": join(baseUrl, "/plugins/attributes.ts"),
  "lume/plugins/base_path.js": join(baseUrl, "/plugins/base_path.ts"),
  "lume/plugins/bundler.js": join(baseUrl, "/plugins/bundler.ts"),
  "lume/plugins/code_highlight.js": join(baseUrl, "/plugins/code_highlight.ts"),
  "lume/plugins/date.js": join(baseUrl, "/plugins/date.ts"),
  "lume/plugins/inline.js": join(baseUrl, "/plugins/inline.ts"),
  "lume/plugins/jsx.js": join(baseUrl, "/plugins/jsx.ts"),
  "lume/plugins/postcss.js": join(baseUrl, "/plugins/postcss.ts"),
  "lume/plugins/pug.js": join(baseUrl, "/plugins/pug.ts"),
  "lume/plugins/relative_urls.js": join(baseUrl, "/plugins/relative_urls.ts"),
  "lume/plugins/slugify_urls.js": join(baseUrl, "/plugins/slugify_urls.ts"),
  "lume/plugins/svg.js": join(baseUrl, "/plugins/svgo.ts"),
  "lume/plugins/terser.js": join(baseUrl, "/plugins/terser.ts"),
  "lume/plugins/eta.js": join(baseUrl, "/plugins/eta.ts"),
};

export const cli = join(baseUrl, "./cli/cli.ts");
export const importMap = `data:application/json;base64,${
  encode(JSON.stringify({ imports }))
}`;

// Run the current command
if (import.meta.main) {
  const process = Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      "--unstable",
      "-A",
      `--import-map=${importMap}`,
      `--no-check`,
      cli,
      ...Deno.args,
    ],
  });
  
  const status = await process.status();
  process.close();
  
  if (!status.success) {
    window.addEventListener("unload", () => Deno.exit(1));
  }
}
