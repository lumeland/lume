import { Page } from "./filesystem.ts";
import { brightGreen, gray } from "./deps/colors.ts";

export default class Metrics {
  constructor(site) {
    this.site = site;
  }

  start(name, subject, processor) {
    if (this.site.options.metrics) {
      const markName = this.#getMarkName(name, subject, processor);
      performance.mark(markName);
    }
  }

  end(name, subject, processor) {
    if (this.site.options.metrics) {
      const markName = this.#getMarkName(name, subject, processor);
      performance.measure(markName, markName);
    }
  }

  #getMarkName(name, subject, processor) {
    if (processor) {
      name += ` ${processor.name}`;
    }
    if (subject) {
      name += `: ${
        subject instanceof Page ? subject.src.path + subject.src.ext : subject
      }`;
    }
    return name;
  }

  get entries() {
    return performance.getEntriesByType("measure");
  }

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

  async save(file) {
    await Deno.writeTextFile(file, JSON.stringify(this.entries));
  }
}
