import { DOMParser } from "./deps/dom.js";
import { SEP } from "./deps/path.js";

export async function concurrent(iterable, iteratorFn, limit = 200) {
  const executing = [];

  for await (const item of iterable) {
    const p = iteratorFn(item).then(() =>
      executing.splice(executing.indexOf(p), 1)
    );

    executing.push(p);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
}

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

export function merge(defaults, user) {
  const merged = { ...defaults };

  if (!user) {
    return merged;
  }

  for (const [key, value] of Object.entries(user)) {
    if (isPlainObject(merged[key]) && isPlainObject(value)) {
      merged[key] = merge(merged[key], value);
      continue;
    }

    merged[key] = value;
  }

  return merged;
}

function isPlainObject(obj) {
  return typeof obj === "object" && obj.toString() === "[object Object]";
}

export function normalizePath(path) {
  return SEP === "/" ? path : path.replaceAll(SEP, "/");
}

export function searchByExtension(path, extensions) {
  for (const [key, value] of extensions) {
    if (path.endsWith(key)) {
      return [key, value];
    }
  }
}

export function documentToString(document) {
  const { doctype } = document;

  return `<!DOCTYPE ${doctype.name}` +
    (doctype.publicId ? ` PUBLIC "${doctype.publicId}"` : "") +
    (!doctype.publicId && doctype.systemId ? " SYSTEM" : "") +
    (doctype.systemId ? ` "${doctype.systemId}"` : "") +
    `>\n${document.documentElement.outerHTML}`;
}

const parser = new DOMParser();

export function stringToDocument(string) {
  return parser.parseFromString(string, "text/html");
}

export class Exception extends Error {
  constructor(message, data, error) {
    super(message);
    this.data = data;
    this.error = error;
  }
}
