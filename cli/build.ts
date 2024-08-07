import { buildSite } from "./utils.ts";

/** Build the website and optionally watch changes and serve the site */
export function build(
  config: string | undefined,
  serve?: boolean,
  watch?: boolean,
) {
  if (!serve && !watch) {
    buildSite(config);
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
      type,
      config,
      serve,
    });

    worker.onmessage = (event) => {
      if (event.data.type === "reload") {
        init();
      }
    };
  }

  init();
}
