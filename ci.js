import { encode } from "./deps/base64.js";
import { posix } from "./deps/path.js";

const baseUrl = new URL(".", import.meta.url).href;
const cli = posix.join(baseUrl, "./cli.js");
const importMap = `data:application/json;base64,${
  encode(`{"imports":{"lume/":"${posix.join(baseUrl, "/")}"}}`)
}`;

const process = Deno.run({
  cmd: [
    Deno.execPath(),
    "run",
    "--unstable",
    "-A",
    `--import-map=${importMap}`,
    cli,
    ...Deno.args,
  ],
});

const status = await process.status();
process.close();

if (!status.success) {
  window.addEventListener("unload", () => Deno.exit(1));
}
