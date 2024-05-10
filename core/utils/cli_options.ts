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

  if (cli.port) {
    (options.server ||= {}).port = parseInt(cli.port);
  } else if (cli.serve) {
    (options.server ||= {}).port = 3000;
  }

  let location: URL;

  if (cli.location) {
    location = new URL(cli.location);
  } else if (options.location && !cli.server) {
    location = options.location as URL;
  } else {
    location = new URL("http://localhost");
  }

  let port: number;

  if (cli.port) {
    port = parseInt(cli.port);
  } else if (location.port) {
    port = parseInt(location.port);
  } else if (options.server?.port) {
    port = options.server.port;
  } else {
    port = cli.serve ? 3000 : location.protocol === "https:" ? 443 : 80;
  }

  (options.server ||= {}).port = port;
  location.port = port.toString();
  options.location = location;

  if (cli.open) {
    (options.server ||= {}).open = cli.open;
  }

  return options;
}
