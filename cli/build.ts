import { log } from "../core/utils/log.ts";
import { resolveConfigFile } from "../core/utils/lume_config.ts";
import { EmptyWriter } from "../core/writer.ts";
import { buildSite, createSite } from "./utils.ts";

/** Build the website and optionally watch changes and serve the site */
export async function build(
  config: string | undefined,
  serve?: boolean,
  watch?: boolean,
  cms?: boolean,
  dryRun?: boolean,
) {
  if (!serve && !watch) {
    const _config = await resolveConfigFile(
      ["_config.ts", "_config.js"],
      config,
    );
    const site = await createSite(_config);

    if (dryRun) {
      site.writer = new EmptyWriter();
    }

    await buildSite(site);

    const hasErrors = log.hasErrors;
    log.output();

    if (dryRun && hasErrors) {
      Deno.exit(1);
    }
    return;
  }

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
