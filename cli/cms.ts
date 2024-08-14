export function runCms(
  config: string | undefined,
) {
  const workerUrl = import.meta.resolve("./cms_worker.ts");
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
    });

    worker.onmessage = (event) => {
      if (event.data.type === "reload") {
        init();
      }
    };
  }

  init();
}
