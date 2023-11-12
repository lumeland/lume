import { isUrl } from "../utils.ts";

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
  await cache.put(url, response.clone());

  return isBinary
    ? new Uint8Array(await response.arrayBuffer())
    : response.text();
}

/**
 * Clear the cache of remote files.
 */
export async function clearCache() {
  await caches.delete("lume_remote_files");
}
