import type { Engine } from "./renderer.ts";
import type { Loader } from "./loaders/mod.ts";

export interface Format {
  /** The file extension for this format */
  ext: string;

  /** The type of page */
  pageType?: "page" | "asset";

  /** The file loader used for this format (used by pages, includes, components, etc) */
  loader?: Loader;

  /** The loader used as asset */
  assetLoader?: Loader;

  /** Loader for _data files in this format */
  dataLoader?: Loader;

  /**
   * The template engines used to render this format
   * Used to render the page and components
   */
  engines?: Engine[];

  /** Whether this file must be added or not */
  add?: boolean | ((path: string) => string);

  /** Whether this format must be (pre)processed */
  process?: boolean | Loader;
}

/** Class to store loaders, engines and other stuff related with different formats */
export default class Formats {
  entries = new Map<string, Format>();

  get size(): number {
    return this.entries.size;
  }

  /** Assign a value to a extension */
  set(format: Format, override = true): void {
    const ext = format.ext.toLowerCase();
    const existing = this.entries.get(ext);

    if (existing) {
      if (override) {
        this.entries.set(ext, { ...existing, ...format });
      } else {
        this.entries.set(ext, { ...format, ...existing });
      }
      return;
    }

    // Simple extension (.ts, .js, .json)
    if (ext.match(/^\.\w+$/)) {
      this.entries.set(ext, format);
      return;
    }

    // Chained extension (.tmpl.js) goes first
    if (ext.match(/^\.\w+\.\w+$/)) {
      const entries = Array.from(this.entries.entries());
      entries.unshift([ext, format]);
      this.entries = new Map(entries);
      return;
    }

    throw new Error(
      `Invalid file extension: "${ext}".  It must start with '.'`,
    );
  }

  /** Returns a format by extension */
  get(extension: string): Format | undefined {
    return this.entries.get(extension.toLowerCase());
  }

  /** Delete a format */
  delete(extension: string): void {
    this.entries.delete(extension.toLowerCase());
  }

  /** Returns if a format exists */
  has(extension: string): boolean {
    return this.entries.has(extension.toLowerCase());
  }

  /** Search and return the associated format for a path */
  search(path: string): Format | undefined {
    path = path.toLowerCase();

    for (const format of this.entries.values()) {
      if (path.endsWith(format.ext)) {
        return format;
      }
    }
  }

  /** Delete a cached template */
  deleteCache(file: string): void {
    for (const format of this.entries.values()) {
      format.engines?.forEach((engine) => engine.deleteCache(file));
    }
  }
}
