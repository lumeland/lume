import { createSite } from "./utils.ts";
import { brightGreen, gray } from "../deps/colors.ts";
import runWatch from "./watch.ts";
import runServe from "./serve.ts";

interface Options {
  root: string;
  config?: string;
  serve: boolean;
  watch: boolean;
}

/** Build the website and optionally watch changes and serve the site */
export default async function build(
  { root, config, serve, watch }: Options,
) {
  const site = await createSite(root, config);
  const quiet = site.options.quiet;

  if (!quiet) {
    console.log();
  }

  await site.build(serve);

  if (!quiet) {
    console.log();
    console.log(
      `🍾 ${brightGreen("Site built into")} ${gray(site.options.dest)}`,
    );
  }

  if (serve || watch) {
    // Disable metrics for the watcher
    site.options.metrics = false;

    // Start the watcher
    runWatch({
      root: site.src(),
      ignore: site.dest(),
      update: (files) => site.update(files),
    });

    // Start the local server
    if (serve) {
      await runServe(site.dest(), site.options.server);
    }
  }
}
