import { DOMParser, HTMLDocument } from "./deps/dom.ts";
import { SEP } from "./deps/path.ts";

/**
 * Helper to run concurrently a function for all elements of a Iterable.
 */
export async function concurrent<Type>(
  iterable: AsyncIterable<Type> | Iterable<Type>,
  iteratorFn: (a: Type) => Promise<void>,
  limit = 200,
): Promise<void> {
  const executing: unknown[] = [];

  for await (const item of iterable) {
    const p: unknown = iteratorFn(item).then(() =>
      executing.splice(executing.indexOf(p), 1)
    );

    executing.push(p);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
}

/**
 * The list of supported mime types.
 * It's used by the server and some plugins.
 */
export const mimes = new Map([
  [".apng", "image/apng"],
  [".atom", "application/atom+xml; charset=utf-8"],
  [".avif", "image/avif"],
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpg"],
  [".jpg", "image/jpg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json"],
  [".map", "application/json"],
  [".mp3", "audio/mpeg"],
  [".mp4", "video/mp4"],
  [".ogg", "audio/ogg"],
  [".otf", "font/otf"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".rss", "application/rss+xml; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".ttf", "font/ttf"],
  [".txt", "text/plain; charset=utf-8"],
  [".wasm", "application/wasm"],
  [".webm", "video/webm"],
  [".webmanifest", "application/manifest+json"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".xml", "text/xml"],
  [".zip", "application/zip"],
]);

/**
 * Merge two objects recursively.
 * It's used to merge user options with default options
 */
export function merge<Type>(
  defaults: Type,
  user: Record<string, unknown>,
): Type {
  const merged = { ...defaults };

  if (!user) {
    return merged;
  }

  for (const [key, value] of Object.entries(user)) {
    // @ts-ignore: I don't know how to type this
    if (isPlainObject(merged[key]) && isPlainObject(value)) {
      // @ts-ignore: I don't know how to type this
      merged[key] = merge(merged[key], value);
      continue;
    }

    // @ts-ignore: I don't know how to type this
    merged[key] = value;
  }

  return merged;
}

/**
 * Returns true if the argument passed is a plain object.
 */
function isPlainObject(obj: unknown): boolean {
  return typeof obj === "object" && obj !== null &&
    obj.toString() === "[object Object]";
}

/**
 * Convert the Windows paths (that use the separator "\")
 * to Posix paths (with the separator "/").
 */
export function normalizePath(path: string): string {
  return SEP === "/" ? path : path.replaceAll(SEP, "/");
}

/**
 * Search an extension in a Map.
 * It's useful for cases in which the extension is multiple.
 * Example: page.tmpl.js
 */
export function searchByExtension<Type>(
  path: string,
  extensions: Map<string, Type>,
): undefined | [string, Type] {
  for (const [key, value] of extensions) {
    if (path.endsWith(key)) {
      return [key, value];
    }
  }
}

/**
 * Converts a HTMLDocument instance to string code.
 */
export function documentToString(document: HTMLDocument): string {
  if (!document.documentElement) {
    return "";
  }

  const { doctype } = document;

  if (!doctype) {
    return document.documentElement.outerHTML;
  }

  return `<!DOCTYPE ${doctype.name}` +
    (doctype.publicId ? ` PUBLIC "${doctype.publicId}"` : "") +
    (!doctype.publicId && doctype.systemId ? " SYSTEM" : "") +
    (doctype.systemId ? ` "${doctype.systemId}"` : "") +
    `>\n${document.documentElement.outerHTML}`;
}

const parser = new DOMParser();

/**
 * Parse a string with HTML code and return a HTMLDocument
 */
export function stringToDocument(string: string): HTMLDocument | null {
  return parser.parseFromString(string, "text/html");
}

/**
 * Generic Exception to throw errors.
 * It allows to include extra data and the previous exception.
 */
export class Exception extends Error {
  data: unknown;
  error?: Error;

  constructor(message: string, data: unknown, error?: Error) {
    super(message);
    this.data = data;
    this.error = error;
  }
}
