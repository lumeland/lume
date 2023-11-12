import { emptyDir, ensureDir } from "../deps/fs.ts";
import { posix } from "../deps/path.ts";
import { md5 } from "./utils/digest.ts";

export interface Options {
  /** The folder to load the files from */
  folder?: string;
}

/**
 * Class to cache the content transformations (like imagick manipulations)
 */
export default class Cache {
  #folder: string;

  constructor(options: Options = {}) {
    this.#folder = options.folder || "_cache";
  }

  async set(
    content: string | Uint8Array,
    key: unknown,
    result: string | Uint8Array,
  ): Promise<void> {
    const [dir, file] = await paths(content, key);

    await ensureDir(posix.join(this.#folder, dir));

    if (typeof result === "string") {
      await Deno.writeTextFile(posix.join(this.#folder, dir, file), result);
    } else {
      await Deno.writeFile(posix.join(this.#folder, dir, file), result);
    }
  }

  async get(
    content: Uint8Array,
    key: unknown,
  ): Promise<Uint8Array | undefined> {
    const [dir, file] = await paths(content, key);

    try {
      return await Deno.readFile(posix.join(this.#folder, dir, file));
    } catch {
      // Ignore
    }
  }

  async getText(content: string, key: unknown): Promise<string | undefined> {
    const [dir, file] = await paths(content, key);

    try {
      return await Deno.readTextFile(posix.join(this.#folder, dir, file));
    } catch {
      // Ignore
    }
  }

  async clear(): Promise<void> {
    await emptyDir(this.#folder);
  }
}

function paths(
  content: string | Uint8Array,
  key: unknown,
): Promise<[string, string]> {
  return Promise.all([
    md5(content),
    md5(JSON.stringify(key)),
  ]);
}
