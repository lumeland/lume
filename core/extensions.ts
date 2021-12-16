import { Exception } from "./utils.ts";
import { extname } from "../deps/path.ts";

/** Generic class to store and retrieve items related with extensions */
export default class Extensions<Value> {
  default?: Value;
  entries: [string, Value][] = [];

  constructor(defaultValue?: Value) {
    this.default = defaultValue;
  }

  /** Assign a value to a extension */
  set(extension: string, value: Value): void {
    if (extension === "*") {
      this.default = value;
      return;
    }

    // Simple extension (.ts, .js, .json)
    if (extension.match(/^\.\w+$/)) {
      this.entries.push([extension, value]);
      return;
    }

    // Chained extension (.tmpl.js, .windi.css) goes first
    if (extension.match(/^\.\w+\.\w+$/)) {
      this.entries.unshift([extension, value]);
      return;
    }

    throw new Exception(
      "Invalid extension. It must start with '.' or be '*'",
      { extension },
    );
  }

  /** Get the value assigned to an extension */
  get(extension: string): Value | undefined {
    const entry = this.entries.find(([ext]) => ext === extension);
    return entry ? entry[1] : this.default;
  }

  /** Search a extension/value pair for a path */
  search(path: string): [string, Value] | undefined {
    for (const [extension, value] of this.entries) {
      if (path.endsWith(extension)) {
        return [extension, value];
      }
    }

    return this.default ? [extname(path), this.default] : undefined;
  }

  /** Return all values */
  values(): Value[] {
    return this.entries.map(([, value]) => value);
  }
}
