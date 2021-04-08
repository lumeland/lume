import { bold, red } from "./deps/colors.js";
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
  [".html", "text/html; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".atom", "application/atom+xml; charset=utf-8"],
  [".rss", "application/rss+xml; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".json", "application/json"],
  [".webmanifest", "application/manifest+json"],
  [".ico", "image/x-icon"],
  [".avif", "image/avif"],
  [".png", "image/png"],
  [".apng", "image/apng"],
  [".jpg", "image/jpg"],
  [".jpeg", "image/jpg"],
  [".gif", "image/gif"],
  [".mp3", "audio/mpeg"],
  [".mp4", "video/mpeg"],
  [".xml", "text/xml"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".wasm", "application/wasm"],
  [".webp", "image/webp"],
  [".webm", "video/webm"],
  [".zip", "application/zip"],
]);

export function error(context, message, exception) {
  console.error(bold(red(`${context}:`)), message);
  if (exception) {
    console.error(exception);
  }
  console.error("");
}

export function merge(defaults, user) {
  const merged = { ...defaults };

  if (!user) {
    return merged;
  }

  for (const [key, value] of Object.entries(user)) {
    if (
      typeof merged[key] === "object" && typeof value === "object" &&
      !Array.isArray(merged[key])
    ) {
      merged[key] = merge(merged[key], value);
      continue;
    }

    merged[key] = value;
  }

  return merged;
}

export function normalizePath(path) {
  // Is Windows path
  if (SEP !== "/") {
    return path.replaceAll(SEP, "/");
  }

  return path;
}

export const slugChars = new Map([
  ["ð", "d"],
  ["ß", "ss"],
]);

export function slugify(string) {
  return string.toLowerCase()
    .normalize("NFKD")
    .replaceAll(/[\s_-]+/g, "-")
    .replaceAll(/[^\w\/-]/g, (char) => slugChars.get(char) || "");
}

export function searchByExtension(path, extensions) {
  for (const [key, value] of extensions) {
    if (path.endsWith(key)) {
      return [key, value];
    }
  }
}
