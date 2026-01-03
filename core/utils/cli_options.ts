import { parseArgs } from "../../deps/cli.ts";
import { getFreePort } from "./net.ts";

import type { DeepPartial } from "./object.ts";
import type { SiteOptions } from "../site.ts";

export function getOptionsFromCli(
  options: DeepPartial<SiteOptions>,
): DeepPartial<SiteOptions> {
  const cli = parseArgs(Deno.args, {
    string: ["src", "dest", "location", "port", "hostname"],
    boolean: ["serve", "open"],
    alias: { serve: "s", port: "p", open: "o" },
    ["--"]: true,
  });

  if (cli.src) {
    options.src = cli.src;
  }

  if (cli.dest) {
    options.dest = cli.dest;
  }

  // Build mode: configure the location
  if (!cli.serve) {
    options.location = cli.location
      ? new URL(cli.location)
      : (options.location as URL | undefined) || new URL("http://localhost");

    return options;
  }

  // Serve mode (--serve or -s)
  // configure the port, hostname and location
  const port = cli.port
    ? parseInt(cli.port)
    : options.server?.port || getFreePort(3000, 3010);

  const hostname: string = cli.hostname
    ? cli.hostname
    : options.server?.hostname || "localhost";

  const location = cli.location
    ? new URL(cli.location)
    : port === 433
    ? new URL(`https://${hostname}`)
    : port === 80
    ? new URL(`http://${hostname}`)
    : new URL(`http://${hostname}:${port}`);

  options.server ||= {};
  options.server.port = port;
  options.server.hostname = hostname;
  options.location = location;

  if (cli.open) {
    options.server.open = cli.open;
  }

  return options;
}
