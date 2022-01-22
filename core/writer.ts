import { dirname, join } from "../deps/path.ts";
import { emptyDir, ensureDir } from "../deps/fs.ts";
import { copy } from "../deps/fs_copy.ts";
import { concurrent, normalizePath, sha1 } from "./utils.ts";

import type { Resource } from "./filesystem.ts";
import type Logger from "./logger.ts";

export interface Options {
  src: string;
  dest: string;
  logger: Logger;
}

/**
 * Class to write the generated resources and static files
 * in the dest folder.
 */
export default class Writer {
  src: string;
  dest: string;
  logger: Logger;
  #hashes = new Map();

  constructor(options: Options) {
    this.src = options.src;
    this.dest = options.dest;
    this.logger = options.logger;
  }

  /**
   * Save the resources in the dest folder
   * Returns an array of resources that have been saved
   */
  async saveResources(resources: Resource[]): Promise<Resource[]> {
    const savedResources: Resource[] = [];

    await concurrent(
      resources,
      async (resource) => {
        if (await this.saveResource(resource)) {
          savedResources.push(resource);
        }
      },
    );

    return savedResources;
  }

  /**
   * Save a resource in the dest folder
   * Returns a boolean indicating if the resource has saved
   */
  async saveResource(resource: Resource): Promise<boolean> {
    // Ignore empty files
    if (!resource.content) {
      return false;
    }

    const dest = resource.dest.path + resource.dest.ext;
    const hash = await sha1(resource.content);
    const previousHash = this.#hashes.get(dest);

    // The page content didn't change
    if (previousHash === hash) {
      return false;
    }

    this.#hashes.set(dest, hash);

    const src = resource.src.path
      ? resource.src.path + (resource.src.ext || "")
      : "(generated)";
    this.logger.log(`🔥 ${dest} <dim>${src}</dim>`);

    const filename = join(this.dest, dest);
    await ensureDir(dirname(filename));

    resource.content instanceof Uint8Array
      ? await Deno.writeFile(filename, resource.content)
      : await Deno.writeTextFile(filename, resource.content);

    return true;
  }

  /** Copy a static file in the dest folder */
  async copyFile(from: string, to: string) {
    const pathFrom = join(this.src, from);
    const pathTo = join(this.dest, to);

    try {
      await ensureDir(dirname(pathTo));
      this.logger.log(`🔥 ${normalizePath(to)} <dim>${from}</dim>`);
      return copy(pathFrom, pathTo, { overwrite: true });
    } catch {
      //Ignored
    }
  }

  /** Empty the dest folder */
  async clear() {
    await emptyDir(this.dest);
    this.#hashes.clear();
  }
}
