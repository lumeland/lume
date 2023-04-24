import { checkUpgrade } from "../core/utils.ts";
import { brightGreen, dim } from "../deps/colors.ts";
import Server from "../core/server.ts";
import FSWatcher, { SiteWatcher } from "../core/watcher.ts";
import { printError } from "../core/errors.ts";
import logger from "../middlewares/logger.ts";
import noCache from "../middlewares/no_cache.ts";
import notFound from "../middlewares/not_found.ts";
import reload from "../middlewares/reload.ts";
import { createSite } from "./run.ts";

interface Options {
  config?: string;
  serve?: boolean;
  watch?: boolean;
}

export default function ({ config, serve, watch }: Options) {
  return build(config, serve, watch);
}

/** Build the website and optionally watch changes and serve the site */
export async function build(
  config: string | undefined,
  serve?: boolean,
  watch?: boolean,
) {
  const site = await createSite(config);
  const quiet = site.options.quiet;

  if (!quiet) {
    console.log();
  }

  performance.mark("start");
  await site.build();
  performance.mark("end");

  if (!quiet) {
    console.log();
    console.log(
      `🍾 ${brightGreen("Site built into")} ${dim(site.options.dest)}`,
    );
    const duration = performance.measure("duration", "start", "end").duration /
      1000;
    const total = site.pages.length + site.files.length;
    console.log(
      dim(`  ${total} files generated in ${duration.toFixed(2)} seconds`),
    );
    console.log();

    await checkUpgrade();
  }

  if (!serve && !watch) {
    // Prevent possible timers to keep the process alive forever (wait preventively 10 seconds)
    const id = setTimeout(() => {
      console.log(
        "After waiting 10 seconds, there are some timers that avoid ending the process.",
      );
      console.log("They have been forcibly closed.");
      Deno.exit(0);
    }, 10000);

    Deno.unrefTimer(id);
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

    console.log("  Server started at:");
    console.log(brightGreen(`  http://localhost:${port}/`), "(local)");

    if (ipAddr) {
      console.log(brightGreen(`  http://${ipAddr}:${port}/`), "(network)");
    }

    console.log();

    if (open) {
      const commands: Record<typeof Deno.build.os, string> = {
        darwin: "open",
        linux: "xdg-open",
        freebsd: "xdg-open",
        netbsd: "xdg-open",
        aix: "xdg-open",
        solaris: "xdg-open",
        illumos: "xdg-open",
        windows: "explorer",
      };

      Deno.run({ cmd: [commands[Deno.build.os], `http://localhost:${port}/`] });
    }

    site.dispatchEvent({ type: "afterStartServer" });
  });

  if (!site.options.quiet) {
    server.use(logger());
  }

  server.use(
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
