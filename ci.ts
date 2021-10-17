import { encode } from "./deps/base64.ts";
import { posix } from "./deps/path.ts";

const { join } = posix;
const baseUrl = new URL(".", import.meta.url).href;
const imports = {
  "lume": join(baseUrl, "/mod.ts"),
  "lume/": join(baseUrl, "/"),
  "https://deno.land/x/lume/": join(baseUrl, "/"),
};

export const cli = join(baseUrl, "./cli.ts");
export const importMap = `data:application/json;base64,${
  encode(JSON.stringify({ imports }))
}`;

// Run the current command
if (import.meta.main) {
  const denoArgs = [
    "--unstable",
    "-A",
    `--import-map=${importMap}`,
    `--no-check`,
  ];

  if (Deno.args.includes("--quiet")) {
    denoArgs.push("--quiet");
  }

  const process = Deno.run({
    cmd: [
      Deno.execPath(),
      "run",
      ...denoArgs,
      cli,
      ...Deno.args,
    ],
  });

  const status = await process.status();
  process.close();

  if (!status.success) {
    addEventListener("unload", () => Deno.exit(1));
  }
}
