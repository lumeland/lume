import { createSite, runWatch } from "./utils.ts";
import { dim } from "../deps/colors.ts";

onmessage = async (event) => {
  const { root, config } = event.data;
  const site = await createSite(root, config);

  await site.build(true);

  postMessage({
    type: "built",
    root: site.dest(),
    options: site.options.server,
  });

  // Set up what extensions need to reload the entire build
  const modules = [".js", ".ts", ".jsx", ".tsx"];
  const reloadExtensions = Array.from(site.source.pages.keys())
    .filter((ext) => modules.some((module) => ext.endsWith(module)));

  // Start the watcher
  console.log();
  console.log("Watching for changes...");

  runWatch({
    root: site.src(),
    ignore: site.dest(),
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
