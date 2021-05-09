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

export function slugify(
  string,
  { lowercase, alphanumeric, separator, replace },
) {
  if (lowercase) {
    string = string.toLowerCase();
  }

  string = string.replaceAll(/[^a-z\d/.-]/giu, (char) => {
    if (char in replace) {
      return replace[char];
    }

    if (alphanumeric) {
      char = char.normalize("NFKD").replaceAll(/[\u0300-\u036F]/g, "");
    }

    char = /[\p{L}\u0300-\u036F]/u.test(char) ? char : "-";

    return alphanumeric && /[^\w-]/.test(char) ? "" : char;
  });

  if (lowercase) {
    string = string.toLowerCase();
  }

  return string
    .replaceAll(/(?<=^|[/.])-+|-+(?=$|[/.])/g, "")
    .replaceAll(/-+/g, separator);
}

export function searchByExtension(path, extensions) {
  for (const [key, value] of extensions) {
    if (path.endsWith(key)) {
      return [key, value];
    }
  }
}

export function documentToString(document) {
  const doctype = document.childNodes[0];

  return `<!DOCTYPE ${doctype.name}` +
    (doctype.publicId ? ` PUBLIC "${doctype.publicId}"` : "") +
    (!doctype.publicId && doctype.systemId ? " SYSTEM" : "") +
    (doctype.systemId ? ` "${doctype.systemId}"` : "") +
    `>\n${document.documentElement.outerHTML}`;
}
