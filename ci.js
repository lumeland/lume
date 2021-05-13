const cli = new URL("./cli.js", import.meta.url);
const importMap = new URL("./import_map.json", import.meta.url);

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
