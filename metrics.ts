import Site from "./site.js";
import { Page } from "./filesystem.ts";
import { brightGreen, gray } from "./deps/colors.ts";

/**
 * Class to collect and return performance metrics
 */
export default class Metrics {
  site: Site;

  constructor(site: Site) {
    this.site = site;
  }

  /**
   * Create a mark to start to measure
   */
  start(name: string, subject?: unknown, processor?: unknown) {
    if (this.site.options.metrics) {
      const markName = this.#getMarkName(name, subject, processor);
      performance.mark(markName);
    }
  }

  /**
   * Measure the time from a mark to now.
   */
  end(name: string, subject?: unknown, processor?: unknown) {
    if (this.site.options.metrics) {
      const markName = this.#getMarkName(name, subject, processor);
      performance.measure(markName, markName);
    }
  }

  /**
   * Generate an unique mark name
   */
  #getMarkName(name: string, subject?: unknown, processor?: unknown) {
    if (processor) {
      // @ts-ignore: processor is the type unknown
      name += ` ${processor.name}`;
    }
    if (subject) {
      name += `: ${
        subject instanceof Page ? subject.src.path + subject.src.ext : subject
      }`;
    }
    return name;
  }

  /**
   * Return the list of collected metrics
   */
  get entries() {
    return performance.getEntriesByType("measure");
  }

  /**
   * Print the metrics in the console
   */
  print() {
    // Sort by duration and get the 100 longest
    const metrics = this.entries
      .sort((a, b) => a.duration - b.duration)
      .slice(-100);

    for (const metric of metrics) {
      const duration = Math.round(metric.duration) + "ms";
      const [name, file] = metric.name.split(": ");

      console.log(
        `${brightGreen(duration.padStart(10))} ${name} ${gray(file || "")}`,
      );
    }
  }

  /**
   * Save the metrics data in a file
   */
  async save(file: string) {
    await Deno.writeTextFile(file, JSON.stringify(this.entries));
  }
}
