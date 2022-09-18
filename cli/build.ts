import { checkUpgrade, createSite } from "./utils.ts";
import { brightGreen, dim } from "../deps/colors.ts";
import Server from "../core/server.ts";
import FSWatcher, { SiteWatcher } from "../core/watcher.ts";
import { printError } from "../core/errors.ts";
import logger from "../middlewares/logger.ts";
import noCache from "../middlewares/no_cache.ts";
import notFound from "../middlewares/not_found.ts";
import reload from "../middlewares/reload.ts";

interface Options {
  root: string;
  config?: string;
  serve?: boolean;
  watch?: boolean;
  exit?: boolean;
}

export default function ({ root, config, serve, watch, exit }: Options) {
  return build(root, config, serve, watch, exit);
}

/** Build the website and optionally watch changes and serve the site */
export async function build(
  root: string,
  config: string | undefined,
  serve?: boolean,
  watch?: boolean,
  exit?: boolean,
) {
  const site = await createSite(root, config);
  const quiet = site.options.quiet;

  if (!quiet) {
    console.log();
  }

  await site.build();

  if (!quiet) {
    console.log();
    console.log(
      `🍾 ${brightGreen("Site built into")} ${dim(site.options.dest)}`,
    );

    await checkUpgrade();
  }

  if (!serve && !watch) {
    if (exit) {
      Deno.exit(0);
    }

    return;
  }

  // Start the watcher
  const watcher = new FSWatcher({
    root: site.src(),
    ignore: site.options.watcher.ignore,
    debounce: site.options.watcher.debounce,
  });

  watcher.addEventListener("change", (event) => {
    const files = event.files!;

    console.log();
    console.log("Changes detected:");
    files.forEach((file) => console.log("-", dim(file)));
    console.log();
    return site.update(files);
  });

  watcher.addEventListener("error", (event) => {
    printError(event.error!);
  });

  watcher.start();

  if (!serve) {
    return;
  }

  // Start the local server
  const { port, open, page404, middlewares } = site.options.server;
  const server = new Server({ root: site.dest(), port });

  server.addEventListener("start", () => {
    const ipAddr = localIp();

    console.log();
    console.log("  Server started at:");
    console.log(brightGreen(`  http://localhost:${port}/`), "(local)");

    if (ipAddr) {
      console.log(brightGreen(`  http://${ipAddr}:${port}/`), "(network)");
    }

    console.log();

    if (open) {
      const commands = {
        darwin: "open",
        linux: "xdg-open",
        windows: "explorer",
      };

      Deno.run({ cmd: [commands[Deno.build.os], `http://localhost:${port}/`] });
    }

    site.dispatchEvent({ type: "afterStartServer" });
  });

  server.use(
    logger(),
    reload({ watcher: new SiteWatcher(site) }),
    noCache(),
    notFound({
      root: site.dest(),
      page404,
      directoryIndex: true,
    }),
  );

  if (middlewares) {
    server.use(...middlewares);
  }

  await server.start();
}

function localIp(): string | undefined {
  for (const info of Deno.networkInterfaces()) {
    if (info.family !== "IPv4" || info.address.startsWith("127.")) {
      continue;
    }

    return info.address;
  }
}
