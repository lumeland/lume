import { brightGreen, gray } from "../deps/colors.ts";
import { dirname } from "../deps/path.ts";
import { ensureDir } from "../deps/fs.ts";
import { Metric, MetricDetail, Metrics, Page, Site } from "../core.ts";

/** Class to represent a disabled Metric */
export class EmptyMetric implements Metric {
  name = "";
  detail?: MetricDetail;

  stop() {
  }
}

/** Class to represent a Metric */
export class PerformanceMetric implements Metric {
  name: string;
  detail?: MetricDetail;

  constructor(name: string = "") {
    this.name = name;
  }

  stop() {
    performance.measure(this.name, {
      start: this.name,
      detail: this.detail,
    });
  }
}

/** Class to collect and return performance metrics */
export default class LumeMetrics implements Metrics {
  site: Site;

  constructor(site: Site) {
    this.site = site;
  }

  start(
    name: string,
    details?: MetricDetail,
  ): Metric {
    if (this.site.options.metrics) {
      const markName = this.#getMarkName(name, details);
      performance.mark(markName);
      return new PerformanceMetric(markName);
    }

    return new EmptyMetric();
  }

  /** Generate an unique mark name */
  #getMarkName(name: string, details?: MetricDetail): string {
    if (!details) {
      return name;
    }

    const data: Record<string, unknown> = { ...details };

    if (details.page) {
      data.page = details.page.src.path + details.page.src.ext;
    }

    return `${name}: ${[...Object.values(data)].join(" ")}`;
  }

  /** Return the list of collected metrics */
  get entries() {
    return performance.getEntriesByType("measure");
  }

  print() {
    // Sort by duration and get the 100 longest
    const metrics = this.entries
      .sort((a, b) => a.duration - b.duration)
      .slice(-100);

    console.log();
    console.log(`⏲ Metrics data:`);
    console.log();

    for (const metric of metrics) {
      const duration = Math.round(metric.duration) + "ms";
      const [name, file] = metric.name.split(": ");

      console.log(
        `${brightGreen(duration.padStart(10))} ${name} ${gray(file || "")}`,
      );
    }
  }

  async save(file: string) {
    await ensureDir(dirname(file));

    function replacer(key: string, value: unknown) {
      if (key === "page") {
        const page = value as Page;

        return {
          src: page.src.path + page.src.ext,
          dest: page.dest.path + page.dest.ext,
        };
      }
      return value;
    }

    await Deno.writeTextFile(
      file,
      JSON.stringify(this.entries, replacer, "  "),
    );

    if (!this.site.options.quiet) {
      console.log();
      console.log(`⏲ ${brightGreen("Metrics data saved in")} ${gray(file)}`);
      console.log();
    }
  }
}
