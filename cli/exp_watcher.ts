import { createSite, runWatch } from "./utils.ts";
import { dim } from "../deps/colors.ts";

onmessage = async (event) => {
  const { root, config } = event.data;
  const site = await createSite(root, config);

  await site.build();

  postMessage({
    type: "built",
    root: site.dest(),
    options: site.options.server,
  });

  // Set up what extensions need to reload the entire build
  const reloadExtensions = [".js", ".ts", ".jsx", ".tsx"];

  // Start the watcher
  console.log();
  console.log("Watching for changes...");

  runWatch({
    root: site.src(),
    ignore: site.options.watcher.ignore,
    fn: (files) => {
      console.log();
      console.log("Changes detected:");
      files.forEach((file) => console.log("-", dim(file)));
      console.log();

      if (mustReload(files)) {
        postMessage({ type: "reload" });
        return false;
      }

      return site.update(files);
    },
  });

  function mustReload(files: Set<string>) {
    return [...files].some((file) =>
      reloadExtensions.some((ext) => file.endsWith(ext))
    );
  }
};
