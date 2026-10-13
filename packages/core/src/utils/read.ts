import { isUrl } from "./path.ts";
import { tokens } from "./tokens.ts";
import { readFile as readFile_, readTextFile } from "../services/fs.ts";
import { fromFileUrl } from "../../deps/path.ts";

import type Cache from "../cache.ts";
let cache: Cache | undefined;

export function setCache(instance: Cache) {
  cache = instance;
}

/**
 * Read a local or remote file and return its content.
 * If the file is remote, it will be cached in the `lume_remote_files` cache.
 */
export async function read(path: string, isBinary?: false, init?: RequestInit): Promise<string>;
export async function read(
  path: string,
  isBinary: true,
  init?: RequestInit,
): Promise<Uint8Array<ArrayBuffer>>;
export async function read(
  path: string,
  isBinary: boolean = false,
  init?: RequestInit,
): Promise<string | Uint8Array<ArrayBuffer>> {
  if (!isUrl(path)) {
    if (path.startsWith("data:")) {
      const response = await fetch(path);

      return isBinary ? new Uint8Array(await response.arrayBuffer()) : response.text();
    }

    return isBinary ? readFile_(path) : readTextFile(path);
  }

  const url = new URL(path);

  if (url.protocol === "file:") {
    const path = fromFileUrl(url);
    return isBinary ? readFile_(path) : readTextFile(path);
  }

  const authorization = tokens.get(url.host);
  if (authorization) {
    const headers = new Headers(init?.headers);
    headers.set("Authorization", authorization);
    init = { ...init, headers };
  }

  const cached = isBinary ? cache?.getBytes([url]) : cache?.getText([url]);

  if (cached) {
    return cached;
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(1000 * 10), // 10s
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch "${url}"`);
  }

  const content = isBinary ? new Uint8Array(await response.arrayBuffer()) : await response.text();
  cache?.set([url], content);
  return content;
}

/** Read a text file like a browser */
export async function readFile(path: string): Promise<string> {
  return await read(path, false, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0",
    },
  });
}

/**
 * Clear the cache of remote files.
 */
export async function clearCache() {
  cache?.clear();
}
