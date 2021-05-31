import { encode } from "./deps/base64.js";

const cli = new URL("./cli.js", import.meta.url);
const importMap = `data:aplication/json;base64,${
  encode(`{"imports":{"lume/":"${new URL(".", import.meta.url).href}/"}}`)
}`;

const process = Deno.run({
  cmd: [
    Deno.execPath(),
    "run",
    "--unstable",
    "-A",
    "--location=https://deno.land/x/lume",
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
