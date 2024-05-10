import { parseArgs } from "../../deps/cli.ts";
import type { DeepPartial } from "./object.ts";
import type { SiteOptions } from "../site.ts";

export function getOptionsFromCli(
  options: DeepPartial<SiteOptions>,
): DeepPartial<SiteOptions> {
  const cli = parseArgs(Deno.args, {
    string: ["src", "dest", "location", "port"],
    boolean: ["serve", "open"],
    alias: { dev: "d", serve: "s", port: "p", open: "o" },
    ["--"]: true,
  });

  if (cli.src) {
    options.src = cli.src;
  }

  if (cli.dest) {
    options.dest = cli.dest;
  }

  if (cli.location) {
    options.location = new URL(cli.location);
  } else if (cli.serve || cli._[0] === "cms") {
    options.location = new URL(`http://localhost:${cli.port || 3000}/`);
  }

  if (cli.port) {
    (options.server ||= {}).port = parseInt(cli.port);

    if (options.location) {
      options.location.port = cli.port;
    }
  }

  if (cli.open) {
    (options.server ||= {}).open = cli.open;
  }

  return options;
}
