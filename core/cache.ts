// deno-lint-ignore-file no-explicit-any

import { emptyDir, ensureDir } from "../deps/fs.ts";
import { posix } from "../deps/path.ts";
import { crypto } from "../deps/crypto.ts";
import { encode } from "../deps/hex.ts";

export interface Options {
  /** The folder to load the files from */
  folder?: string;
}

interface CacheItem {
  content?: string | Uint8Array;
  contentType?: "string" | "Uint8Array";
  ext?: string;
  [key: string]: any;
}

/**
 * Class to manage generic cache. It can be used to store any kind of data.
 */
export default class Cache {
  #folder: string;

  constructor(options: Options = {}) {
    this.#folder = options.folder || "_cache";
  }

  async set(
    content: string | Uint8Array,
    key: any,
    value: CacheItem,
  ): Promise<void> {
    const hash = await this.hash(content);
    const id = await this.hash(JSON.stringify(key));
    const result = value.content;

    await ensureDir(posix.join(this.#folder, hash));

    if (result) {
      value.content = id;
      const ext = value.ext || "";

      if (typeof result === "string") {
        value.contentType = "string";
        await Deno.writeTextFile(
          posix.join(this.#folder, hash, value.content + ext),
          result,
        );
      } else {
        value.contentType = "Uint8Array";
        await Deno.writeFile(
          posix.join(this.#folder, hash, value.content + ext),
          result,
        );
      }
    } else {
      delete value.content;
      delete value.contentType;
    }

    await Deno.writeTextFile(
      posix.join(this.#folder, hash, id + ".json"),
      JSON.stringify(value),
    );
  }

  async get(content: any, key: any): Promise<any> {
    const hash = await this.hash(content);
    const id = await this.hash(JSON.stringify(key));

    try {
      const data = await Deno.readTextFile(
        posix.join(this.#folder, hash, id + ".json"),
      );
      const value = JSON.parse(data);

      if (value.content) {
        const ext = value.ext || "";

        if (value.contentType === "string") {
          const content = Deno.readTextFile(
            posix.join(this.#folder, hash, value.content + ext),
          );
          return { ...value, content };
        } else {
          const content = await Deno.readFile(
            posix.join(this.#folder, hash, value.content + ext),
          );
          return { ...value, content };
        }
      }
      return value;
    } catch {
      // Ignore
    }
    return;
  }

  async clear(): Promise<void> {
    await emptyDir(this.#folder);
  }

  async hash(content: string | Uint8Array): Promise<string> {
    const hash = await crypto.subtle.digest(
      "MD5",
      typeof content === "string" ? new TextEncoder().encode(content) : content,
    );

    const hex = encode(new Uint8Array(hash));
    return new TextDecoder().decode(hex);
  }
}
