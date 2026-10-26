import { posix, SEPARATOR } from "../../deps/path.ts";

const WINDOWS_ABSOLUTE = /^\w:[\\/]/;

/**
 * Convert the Windows paths (that use the separator "\")
 * to Posix paths (with the separator "/")
 * and ensure it starts with "/".
 */
export function normalizePath(path: string) {
  if (SEPARATOR !== "/") {
    path = path.replaceAll(SEPARATOR, "/");

    // Is absolute Windows path (C:/...)
    if (path.match(WINDOWS_ABSOLUTE)) {
      return path;
    }
  }

  return posix.join("/", path);
}

/** Check if the path is an URL */
export function isUrl(path: string): boolean {
  return !!path.match(/^(https?|file):\/\//);
}

/** Check if the path is absolute */
export function isAbsolutePath(path: string): boolean {
  return SEPARATOR !== "/" ? /^\w:[/\\]/.test(path) : path.startsWith("/");
}

/** Split a path to path + extension */
export function getPathAndExtension(path: string): [string, string] {
  const extension = getExtension(path);
  if (!extension) {
    return [path, ""];
  }
  const pathWithoutExtension = path.slice(0, -extension.length);
  return [pathWithoutExtension, extension];
}

/** Get the extension of a path (this works better than std/path) */
export function getExtension(path: string): string {
  const match = path.match(/\.\w+$/);
  return match ? match[0].toLowerCase() : "";
}

export type Extensions = string[] | "*";

export function matchExtension(exts: Extensions, path: string): boolean {
  if (exts === "*") {
    return true;
  }

  return exts.some((ext) => path.endsWith(ext));
}

/**
 * decodeURI() can't decode the `%` character, as it is used in any encoded character
 * @author [Why does decodeURIComponent('%') lock up my browser?](https://stackoverflow.com/a/54310080/3416774)
 */
export function decodeURIComponentSafe(path: string): string {
  return decodeURIComponent(path.replace(/%(?![0-9a-fA-F]+)/g, "%25"));
}
