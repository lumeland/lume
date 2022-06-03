import { Exception } from "./errors.ts";

import type { Engine, Loader } from "../core.ts";

export interface Format {
  /** The file extension for this format */
  ext: string;

  /** The file loader used for this format */
  pageLoader?: Loader;

  /** Loader for _data files in this format */
  dataLoader?: Loader;

  /** Loader for _components files in this format */
  componentLoader?: Loader;

  /**
   * The template engine used to render this format
   * Used to render the page and components
   */
  engine?: Engine;

  /**
   * This is used to distinguish between pages that output html files (like index.njk -> index.html)
   * and pages that output assets (like styles.css -> styles.css).
   */
  asset?: boolean;

  /** A custom path for includes */
  includesPath?: string;

  /** Whether this file must be copied instead loaded */
  copy?: boolean | ((path: string) => string);
}

/** Class to store loaders, engines and other stuff related with different formats */
export default class Formats {
  entries = new Map<string, Format>();

  get size(): number {
    return this.entries.size;
  }

  /** Assign a value to a extension */
  set(format: Format): void {
    const { ext } = format;
    const existing = this.entries.get(ext);

    if (existing) {
      this.entries.set(ext, { ...existing, ...format });
      return;
    }

    // Simple extension (.ts, .js, .json)
    if (ext.match(/^\.\w+$/)) {
      this.entries.set(ext, format);
      return;
    }

    // Chained extension (.tmpl.js, .windi.css) goes first
    if (ext.match(/^\.\w+\.\w+$/)) {
      const entries = Array.from(this.entries.entries());
      entries.unshift([ext, format]);
      this.entries = new Map(entries);
      return;
    }

    throw new Exception(
      "Invalid file extension. It must start with '.'",
      { ext },
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

  /** Search and return the associated format for a path */
  search(path: string): Format | undefined {
    for (const format of this.entries.values()) {
      if (path.endsWith(format.ext)) {
        return format;
      }
    }
  }

  /** Delete a cached template */
  deleteCache(file: string): void {
    for (const format of this.entries.values()) {
      format.engine?.deleteCache(file);
    }
  }
}
