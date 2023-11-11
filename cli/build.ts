import { log } from "../core/utils.ts";
import Server from "../core/server.ts";
import FSWatcher, { SiteWatcher } from "../core/watcher.ts";
import logger from "../middlewares/logger.ts";
import noCache from "../middlewares/no_cache.ts";
import notFound from "../middlewares/not_found.ts";
import reload from "../middlewares/reload.ts";
import { createSite } from "./run.ts";

interface Options {
  config?: string;
  serve?: boolean;
  watch?: boolean;
  dev?: boolean;
}

export default function ({ config, serve, watch, dev }: Options) {
  if (dev) {
    Deno.env.set("LUME_ENV", "development");
  }

  return build(config, serve, watch);
}

/** Build the website and optionally watch changes and serve the site */
export async function build(
  config: string | undefined,
  serve?: boolean,
  watch?: boolean,
) {
  const site = await createSite(config);

  performance.mark("start");
  await site.build();
  performance.mark("end");

  log.info(`🍾 Site built into <dim>${site.options.dest}</dim>`);
  const duration = performance.measure("duration", "start", "end").duration /
    1000;
  const total = site.pages.length + site.files.length;
  log.info(
    `  <dim>${total} files generated in ${duration.toFixed(2)} seconds</dim>`,
  );

  if (!serve && !watch) {
    // Prevent possible timers to keep the process alive forever (wait preventively 10 seconds)
    const id = setTimeout(() => {
      log.warning(
        "After waiting 10 seconds, there are some timers that avoid ending the process.",
      );
      log.warning("They have been forcibly closed.");
      Deno.exit(0);
    }, 10000);

    Deno.unrefTimer(id);
    return;
  }

  // Set the live reload environment variable to add hash to the URLs in the module loader
  Deno.env.set("LUME_LIVE_RELOAD", "true");

  // Start the watcher
  const watcher = new FSWatcher({
    root: site.src(),
    ignore: site.options.watcher.ignore,
    debounce: site.options.watcher.debounce,
  });

  watcher.addEventListener("change", (event) => {
    const files = event.files!;

    log.info("Changes detected:");
    files.forEach((file) => log.info(`- <dim>${file}</dim>`));
    return site.update(files);
  });

  watcher.addEventListener("error", (event) => {
    console.error(Deno.inspect(event.error, { colors: true }));
  });

  watcher.start();

  if (!serve) {
    return;
  }

  // Start the local server
  const { port, open, page404, middlewares } = site.options.server;
  const server = new Server({
    root: site.root(site.options.dest),
    port,
  });

  server.addEventListener("start", () => {
    const ipAddr = localIp();

    log.info("  Server started at:");
    log.info(`  <green>http://localhost:${port}/</green> (local)`);

    if (ipAddr) {
      log.info(`  <green>http://${ipAddr}:${port}/</green> (network)`);
    }

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

      new Deno.Command(commands[Deno.build.os], {
        args: [`http://localhost:${port}/`],
        stdout: "inherit",
        stderr: "inherit",
      }).output();
    }

    site.dispatchEvent({ type: "afterStartServer" });
  });

  if (log.level === 0) {
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

  server.start();
}

function localIp(): string | undefined {
  for (const info of Deno.networkInterfaces()) {
    if (info.family !== "IPv4" || info.address.startsWith("127.")) {
      continue;
    }

    return info.address;
  }
}
