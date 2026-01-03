import { resolveConfigFile } from "../core/utils/lume_config.ts";
import { buildSite, createSite } from "./utils.ts";
import { env } from "../core/utils/env.ts";

/** Build the website and optionally watch changes and serve the site */
export async function build(
  config: string | undefined,
  serve?: boolean,
  watch?: boolean,
  cms?: boolean,
) {
  if (!serve && !watch) {
    const _config = await resolveConfigFile(
      ["_config.ts", "_config.js"],
      config,
    );
    const site = await createSite(_config);
    await buildSite(site);
    return;
  }

  const isProxied = env<boolean>("LUME_PROXIED");
  const workerUrl = import.meta.resolve("./build_worker.ts");
  let worker: Worker;

  function init() {
    let type = "build";

    if (worker) {
      type = "rebuild";
      worker.terminate();
    }

    worker = new Worker(workerUrl, { type: "module" });
    worker.postMessage({
      type: "localStorage",
      data: { ...localStorage },
    });

    worker.postMessage({
      type,
      config,
      serve,
      cms,
    });

    worker.onmessage = (event) => {
      switch (event.data.type) {
        case "exit":
          return Deno.exit(0);

        case "reload":
          // If the server is proxied just exit. It will be restarted by the parent process
          if (worker && isProxied) {
            return Deno.exit(0);
          }
          init();
          break;

        case "localStorage": {
          const { method, args } = event.data;
          localStorage[method](...args);
          break;
        }
      }
    };
  }

  init();
}
