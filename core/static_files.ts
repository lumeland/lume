import { join } from "../deps/path.ts";

/**
 * Class to handle static files.
 */
export default class StaticFiles {
  /** List of files and folders to copy */
  paths = new Map<string, string>();

  add(from: string, to: string) {
    // Ensure the path starts with a slash
    this.paths.set(join("/", from), join("/", to));
  }

  /**
   * Check whether a path is included in the list of static files
   * and return a [from, to] tuple
   */
  search(file: string): [string, string] | undefined {
    for (const entry of this.paths) {
      const [from, to] = entry;

      if (file.startsWith(from)) {
        return [file, join(to, file.slice(from.length))];
      }
    }
  }
}
