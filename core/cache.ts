import { emptyDir, ensureDir } from "../deps/fs.ts";
import { posix } from "../deps/path.ts";
import { md5 } from "./utils/digest.ts";

export interface Options {
  /** The folder to load the files from */
  folder: string;
}

/**
 * Class to manage cache in the _cache folder
 */
export default class Cache {
  #folder: string;

  constructor(options: Options) {
    this.#folder = options.folder;
  }

  /** Save some content in the cache folder */
  async set(
    key: unknown[],
    result: string | Uint8Array,
  ): Promise<void> {
    const path = await this.getPath(key);

    await ensureDir(posix.dirname(path));

    if (typeof result === "string") {
      Deno.writeTextFileSync(path, result);
    } else {
      Deno.writeFileSync(path, result);
    }
  }

  /** Remove content from the cache folder */
  async remove(key: unknown[]): Promise<void> {
    try {
      Deno.removeSync(await this.getPath(key));
    } catch {
      // Ignore
    }
  }

  async getPath(key: unknown[]): Promise<string> {
    const paths = await Promise.all(key.map((value) => {
      if (value instanceof Uint8Array || typeof value === "string") {
        return md5(value);
      }
      return md5(JSON.stringify(value));
    }));
    return posix.join(this.#folder, ...paths);
  }

  /** Get the content from the cache folder as Uint8Array */
  async getBytes(key: unknown[]): Promise<Uint8Array | undefined> {
    try {
      return Deno.readFileSync(await this.getPath(key));
    } catch {
      // Ignore
    }
  }

  /** Get the content from the cache folder as string */
  async getText(key: unknown[]): Promise<string | undefined> {
    try {
      return Deno.readTextFileSync(await this.getPath(key));
    } catch {
      // Ignore
    }
  }

  /** Empty the cache folder */
  async clear(): Promise<void> {
    await emptyDir(this.#folder);
  }
}
