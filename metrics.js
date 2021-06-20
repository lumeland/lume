import { Page } from "./filesystem.js";

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
}
