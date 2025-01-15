import { parseArgs } from "../../deps/cli.ts";
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

  const serveMode = cli.serve || cli._[0] === "cms";

  // Detect location, hostname and port
  let port: number;
  let hostname: string;
  let location: URL;

  if (serveMode) {
    location = cli.location
      ? new URL(cli.location)
      : new URL("http://localhost");

    if (cli.port) {
      port = parseInt(cli.port);
      location.port = port.toString();
    } else if (location.port) {
      port = parseInt(location.port);
    } else if (options.server?.port) {
      port = options.server.port;
      location.port = port.toString();
    } else {
      port = location.protocol === "https:" ? 443 : 3000;
      location.port = port.toString();
    }

    if (cli.hostname) {
      hostname = cli.hostname;
      location.hostname = hostname;
    } else if (options.server?.hostname && !cli.location) {
      hostname = options.server.hostname;
      location.hostname = hostname;
    } else {
      hostname = location.hostname;
    }
  } else {
    location = cli.location
      ? new URL(cli.location)
      : (options.location as URL | undefined) || new URL("http://localhost");

    if (cli.port) {
      port = parseInt(cli.port);
      location.port = port.toString();
    } else if (location.port) {
      port = parseInt(location.port);
    } else {
      port = location.protocol === "https:" ? 443 : 80;
    }

    if (cli.hostname) {
      hostname = cli.hostname;
      location.hostname = hostname;
    } else {
      hostname = location.hostname;
    }
  }

  options.location = location;
  options.server ||= {};
  options.server.port = port;
  options.server.hostname = hostname;

  if (cli.open) {
    options.server.open = cli.open;
  }

  return options;
}
