import { Exception } from "./errors.ts";

import type { Engine, Loader } from "../core.ts";

export interface Format {
  removeExtension?: boolean;
  loader?: Loader;
  page?: boolean;
  data?: boolean;
  component?: boolean;

  includesPath?: string;
  engine?: Engine;
  componentEngine?: Engine;
}

/** Class to store loaders, engines and other stuff related with different formats */
export default class Formats {
  entries = new Map<string, Format>();

  get size(): number {
    return this.entries.size;
  }

  /** Assign a value to a extension */
  set(extension: string, format: Format): void {
    const existing = this.entries.get(extension);

    if (existing) {
      this.entries.set(extension, { ...existing, ...format });
      return;
    }

    // Simple extension (.ts, .js, .json)
    if (extension.match(/^\.\w+$/)) {
      this.entries.set(extension, format);
      return;
    }

    // Chained extension (.tmpl.js, .windi.css) goes first
    if (extension.match(/^\.\w+\.\w+$/)) {
      const entries = Array.from(this.entries.entries());
      entries.unshift([extension, format]);
      this.entries = new Map(entries);
      return;
    }

    throw new Exception(
      "Invalid extension. It must start with '.'",
      { extension },
    );
  }

  /** Returns a format by extension */
  get(extension: string): Format | undefined {
    return this.entries.get(extension);
  }

  /** Delete a format */
  delete(extension: string): void {
    this.entries.delete(extension);
  }

  /** Returns if a format exists */
  has(extension: string): boolean {
    return this.entries.has(extension);
  }

  /** Search and return a [extension, format] pair for a path */
  search(path: string): [string, Format] | undefined {
    for (const [extension, value] of this.entries) {
      if (path.endsWith(extension)) {
        return [extension, value];
      }
    }
  }

  /** Delete a cached template */
  deleteCache(file: string): void {
    for (const format of this.formats()) {
      format.engine?.deleteCache(file);
      format.componentEngine?.deleteCache(file);
    }
  }

  /** Return a iterator for the formats */
  formats() {
    return this.entries.values();
  }

  /** Return a iterator for the extensions */
  extensions() {
    return this.entries.keys();
  }
}
