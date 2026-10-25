import { posix } from "../../deps/path.ts";
import type { default as FS, Entry } from "../fs.ts";

export function getInclude(fromDir: string, to: string, fs: FS): Entry | undefined {
  // Absolute path
  if (to.startsWith("/_includes/")) {
    return fs.entries.get(to);
  }

  // Relative path
  if (to.startsWith(".")) {
    return fs.entries.get(posix.join("/", fromDir, to));
  }

  // Get from _includes folder
  return fs.entries.get(posix.join("/_includes", to));
}
