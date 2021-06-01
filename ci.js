import { encode } from "./deps/base64.js";
import { join } from "./deps/path.js";

const baseUrl = new URL(".", import.meta.url).href;
const cli = join(baseUrl, "./cli.js");
const importMap = `data:aplication/json;base64,${
  encode(`{"imports":{"lume/":"${join(baseUrl, "/")}"}}`)
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
