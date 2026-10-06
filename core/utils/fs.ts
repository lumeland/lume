import { join } from "../../deps/path.ts";
import {
  FsError,
  mkdirSync,
  readDirSync,
  remove,
  statSync,
} from "../../services/fs.ts";

/** Ensure a directory is empty */
export function emptyDir(dir: string) {
  try {
    for (const item of readDirSync(dir)) {
      return remove(join(dir, item.name), true);
    }
  } catch (error) {
    if ((error as FsError).code !== "not-found") {
      throw error;
    }

    // if not exist. then create it
    mkdirSync(dir, true);
  }
}

/** Ensure a directory exists */
export function ensureDir(dir: string) {
  try {
    const fileInfo = statSync(dir);
    if (!fileInfo.isDirectory) {
      throw new Error(
        `Failed to ensure directory exists: ${dir} already exists but it's not a directory`,
      );
    }
    return;
  } catch (error) {
    if ((error as FsError).code !== "not-found") {
      throw error;
    }

    mkdirSync(dir, true);
  }
}
