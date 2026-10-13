import { parseArgs } from "node:util";
import { args } from "@lumeland/core/services/process.ts";
import { checkPort } from "@lumeland/core/services/net.ts";

import type { SiteOptions } from "@lumeland/core/site.ts";

interface CliArgs {
  src?: string;
  dest?: string;
  location?: string;
  port?: number;
  hostname?: string;
  serve?: boolean;
  open?: boolean;
}

async function getCliArgs(): Promise<CliArgs> {
  const { values } = parseArgs({
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

  let port: number | undefined;

  if (values.serve && !values.port) {
    for (let p = 3000; p <= 3010; ++p) {
      if (await checkPort(p)) {
        port = p;
        break;
      }
    }
  } else if (values.port) {
    port = parseInt(values.port, 10);
  }

  return {
    src: values.src,
    dest: values.dest,
    location: values.location,
    port,
    hostname: values.hostname,
    serve: values.serve,
    open: values.open,
  };
}

const cli = await getCliArgs();

export function getOptionsFromCli(options: SiteOptions): SiteOptions {
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
  const port = cli.port ?? options.server?.port ?? 3000;

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
