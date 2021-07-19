import { posix } from "./deps/path.ts";

const { join } = posix;
const baseUrl = new URL(".", import.meta.url).href;
const imports = {
  "lume": join(baseUrl, "/mod.ts"),
  "lume/": join(baseUrl, "/"),
};

export const cli = join(baseUrl, "./cli/cli.ts");
export const importMap = `data:application/json;utf8,${
  JSON.stringify({ imports })
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
