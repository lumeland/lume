import { encode } from "./deps/base64.ts";
import { posix } from "./deps/path.ts";

const baseUrl = new URL(".", import.meta.url).href;
const cli = posix.join(baseUrl, "./cli/cli.ts");
const importMap = `data:application/json;base64,${
  encode(`{ "imports": { "lume/": "${posix.join(baseUrl, "/")}" } }`)
}`;

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
