import { parseArgs } from "node:util";
import { args } from "@lumeland/core/services/process.ts";

import type { SiteOptions } from "@lumeland/core/site.ts";

export function getOptionsFromCli(options: SiteOptions): SiteOptions {
  const { values: cli } = parseArgs({
    allowPositionals: true,
    args: args(),
    options: {
      src: {
        type: "string",
      },
      dest: {
        type: "string",
      },
      location: {
        type: "string",
      },
      port: {
        type: "string",
        short: "p",
      },
      hostname: {
        type: "string",
      },
      serve: {
        type: "boolean",
        short: "s",
      },
      open: {
        type: "boolean",
        short: "o",
      },
    },
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
  const port = cli.port ? parseInt(cli.port) : options.server?.port || 3000;

  const hostname: string = cli.hostname ? cli.hostname : options.server?.hostname || "localhost";

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
