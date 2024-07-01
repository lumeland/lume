import { isUrl } from "./path.ts";
import { env } from "./env.ts";

const useCache = env<boolean>("LUME_NOCACHE") !== true;

/**
 * Read a local or remote file and return its content.
 * If the file is remote, it will be cached in the `lume_remote_files` cache.
 */
export async function read(
  path: string,
  isBinary: boolean,
): Promise<Uint8Array | string>;
export async function read(
  path: string,
  isBinary: true,
  init?: RequestInit,
): Promise<Uint8Array>;
export async function read(
  path: string,
  isBinary: false,
  init?: RequestInit,
): Promise<string>;
export async function read(
  path: string,
  isBinary: boolean,
  init?: RequestInit,
): Promise<string | Uint8Array> {
  if (!isUrl(path)) {
    if (path.startsWith("data:")) {
      const response = await fetch(path);

      return isBinary
        ? new Uint8Array(await response.arrayBuffer())
        : response.text();
    }

    return isBinary ? Deno.readFile(path) : Deno.readTextFile(path);
  }

  const url = new URL(path);

  if (url.protocol === "file:") {
    return isBinary ? Deno.readFile(url) : Deno.readTextFile(url);
  }

  if (!useCache) {
    const response = await fetch(url, init);

    if (!response.ok) {
      throw new Error(`Failed to fetch "${url}"`);
    }

    return isBinary
      ? new Uint8Array(await response.arrayBuffer())
      : response.text();
  }

  const cache = await caches.open("lume_remote_files");

  // Prevent https://github.com/denoland/deno/issues/19696
  try {
    const cached = await cache.match(url);

    if (cached) {
      return isBinary
        ? new Uint8Array(await cached.arrayBuffer())
        : cached.text();
    }
  } catch {
    // ignore
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`Failed to fetch "${url}"`);
  }

  await cache.put(url, response.clone());

  return isBinary
    ? new Uint8Array(await response.arrayBuffer())
    : response.text();
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
  await caches.delete("lume_remote_files");
}
