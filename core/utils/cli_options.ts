import { parseArgs } from "../../deps/cli.ts";
import type { DeepPartial } from "./object.ts";
import type { SiteOptions } from "../site.ts";

export function getOptionsFromCli(): DeepPartial<SiteOptions> {
  const options = parseArgs(Deno.args, {
    string: ["src", "dest", "location", "port"],
    boolean: ["serve", "open"],
    alias: { dev: "d", serve: "s", port: "p", open: "o" },
    ["--"]: true,
  });

  const overrides: DeepPartial<SiteOptions> = {};

  if (options.src) {
    overrides.src = options.src;
  }

  if (options.dest) {
    overrides.dest = options.dest;
  }

  if (options.location) {
    overrides.location = new URL(options.location);
  } else if (options.serve || options._[0] === "cms") {
    overrides.location = new URL(`http://localhost:${options.port || 3000}/`);
  }

  if (options.port) {
    (overrides.server ||= {}).port = parseInt(options.port);

    if (overrides.location) {
      overrides.location.port = options.port;
    }
  }

  if (options.open) {
    (overrides.server ||= {}).open = options.open;
  }

  return overrides;
}
