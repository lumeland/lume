import Metrics from "../metrics.js";
import { createSite } from "./utils.ts";
import { brightGreen, gray } from "../deps/colors.js";
import runWatch from "./watch.ts";
import runServe from "./serve.ts";
import { join } from "../deps/path.js";

interface Options {
  root: string;
  config: string;
  serve: boolean;
  watch: boolean;
}

/**
 * Command to build the website
 * and optionally watch changes and serve the site
 */
export default async function build(
  { root, config, serve, watch }: Options,
) {
  const site = await createSite(root, config);

  console.log();
  await site.build(serve);
  console.log();
  console.log(`🍾 ${brightGreen("Site built into")} ${gray(site.options.dest)}`);

  if (site.options.metrics) {
    const file = typeof site.options.metrics === "string"
      ? site.options.metrics
      : undefined;
    printMetrics(site.metrics, file);
  }

  if (serve) {
    await runWatch(site);
    await runServe(site);
  } else if (watch) {
    await runWatch(site);
  }
}

/**
 * Print the performance metrics
 * or save them to a file
 */
async function printMetrics(metrics: Metrics, file?: string) {
  if (file) {
    file = join(Deno.cwd(), file);
    await metrics.save(file);
    console.log();
    console.log(`⏲ ${brightGreen("Metrics data saved in")} ${gray(file)}`);
    console.log();
    return;
  }

  console.log();
  console.log(`⏲ Metrics data:`);
  console.log();
  metrics.print();
}
