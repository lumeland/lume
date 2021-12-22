import { DOMParser, HTMLDocument } from "../deps/dom.ts";
import { extname, join, SEP } from "../deps/path.ts";

import type { FileResponse } from "../core.ts";

/** Run a callback concurrently with all the elements of an Iterable */
export async function concurrent<Type>(
  iterable: AsyncIterable<Type> | Iterable<Type>,
  iteratorFn: (arg: Type) => Promise<unknown>,
  limit = 200,
) {
  const executing: Promise<unknown>[] = [];

  for await (const item of iterable) {
    const p: Promise<unknown> = iteratorFn(item).then(() =>
      executing.splice(executing.indexOf(p), 1)
    );

    executing.push(p);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
}

const decoder = new TextDecoder();
const encoder = new TextEncoder();

/** Encode a message using SHA-1 algorithm */
export async function sha1(message: string | Uint8Array): Promise<string> {
  if (typeof message === "string") {
    message = encoder.encode(message);
  }

  const hash = await crypto.subtle.digest("SHA-1", message);
  return decoder.decode(hash);
}

/**
 * The list of supported MIME types.
 * It's used by the server and some plugins.
 */
export const mimes = new Map<string, string>([
  [".aac", "audio/x-aac"],
  [".apng", "image/apng"],
  [".atom", "application/atom+xml; charset=utf-8"],
  [".avif", "image/avif"],
  [".bmp", "image/bmp"],
  [".css", "text/css; charset=utf-8"],
  [".es", "application/ecmascript"],
  [".eps", "application/postscript"],
  [".epub", "application/epub+zip"],
  [".flac", "audio/x-flac"],
  [".gif", "image/gif"],
  [".gz", "aplication/gzip"],
  [".heic", "image/heic"],
  [".heif", "image/heif"],
  [".html", "text/html; charset=utf-8"],
  [".htm", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpg"],
  [".jpg", "image/jpg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json"],
  [".kml", "application/vnd.google-earth.kml+xml"],
  [".kmz", "application/vnd.google-earth.kmz"],
  [".map", "application/json"],
  [".md", "text/markdown; charset=utf-8"],
  [".mid", "audio/midi"],
  [".midi", "audio/midi"],
  [".mjs", "application/javascript"],
  [".mkv", "video/x-matroska"],
  [".mov", "video/quicktime"],
  [".mp3", "audio/mp3"],
  [".mp4", "video/mp4"],
  [".mp4a", "video/mp4"],
  [".mp4v", "video/mp4"],
  [".m4a", "video/mp4"],
  [".ogg", "audio/ogg"],
  [".opus", "audio/ogg"],
  [".otf", "font/otf"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".ps", "application/postscript"],
  [".rar", "application/vnd.rar"],
  [".rdf", "application/rdf+xml; charset=utf-8"],
  [".rss", "application/rss+xml; charset=utf-8"],
  [".rtf", "application/rtf"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".tiff", "image/tiff"],
  [".ttf", "font/ttf"],
  [".txt", "text/plain; charset=utf-8"],
  [".vtt", "text/vtt; charset=utf-8"],
  [".wasm", "application/wasm"],
  [".wav", "audio/wav"],
  [".webm", "video/webm"],
  [".webmanifest", "application/manifest+json"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".yaml", "text/yaml; charset=utf-8"],
  [".yml", "text/yaml; charset=utf-8"],
  [".xml", "text/xml"],
  [".zip", "application/zip"],
]);

/**
 * Merge two objects recursively.
 * It's used to merge user options with default options.
 */
export function merge<Type>(
  defaults: Type,
  user?: Partial<Type>,
) {
  const merged = { ...defaults };

  if (!user) {
    return merged;
  }

  for (const [key, value] of Object.entries(user)) {
    // @ts-ignore: No index signature with a parameter of type 'string' was found on type 'unknown'
    if (isPlainObject(merged[key]) && isPlainObject(value)) {
      // @ts-ignore: Type 'string' cannot be used to index type 'Type'
      merged[key] = merge(merged[key], value);
      continue;
    }

    // @ts-ignore: Type 'string' cannot be used to index type 'Type'
    merged[key] = value;
  }

  return merged;
}

const reactElement = Symbol.for("react.element");
/** Check if the argument passed is a plain object */
export function isPlainObject(obj: unknown) {
  return typeof obj === "object" && obj !== null &&
    obj.toString() === "[object Object]" &&
    // @ts-ignore: Check if the argument passed is a React element
    obj["$$typeof"] !== reactElement;
}

/**
 * Convert the Windows paths (that use the separator "\")
 * to Posix paths (with the separator "/").
 */
export function normalizePath(path: string) {
  return SEP === "/" ? path : path.replaceAll(SEP, "/");
}

/**
 * Search an extension in a map.
 * It's useful for cases in which the extension is multiple.
 * Example: page.tmpl.js
 */
export function searchByExtension<Type>(
  path: string,
  extensions: Map<string, Type>,
): [string, Type] | undefined {
  for (const [key, value] of extensions) {
    if (path.endsWith(key)) {
      return [key, value];
    }
  }
}

/** Convert an HTMLDocument instance to a string */
export function documentToString(document: HTMLDocument) {
  const { doctype, documentElement } = document;

  if (!doctype) {
    return documentElement?.outerHTML || "";
  }

  return `<!DOCTYPE ${doctype.name}` +
    (doctype.publicId ? ` PUBLIC "${doctype.publicId}"` : "") +
    (!doctype.publicId && doctype.systemId ? " SYSTEM" : "") +
    (doctype.systemId ? ` "${doctype.systemId}"` : "") +
    `>\n${documentElement?.outerHTML}`;
}

const parser = new DOMParser();

/** Parse a string with HTML code and return an HTMLDocument */
export function stringToDocument(string: string): HTMLDocument {
  const document = parser.parseFromString(string, "text/html");

  if (!document) {
    throw new Error("Unable to parse the HTML code");
  }

  return document;
}

export interface serveFileOptions {
  root: string;
  directoryIndex: boolean;
  page404: string;
  router?: (url: URL) => Promise<FileResponse | undefined>;
}

export async function serveFile(
  url: URL,
  { root, directoryIndex, page404, router }: serveFileOptions,
): Promise<FileResponse> {
  const { pathname } = url;
  let path = join(root, pathname);

  try {
    if (path.endsWith(SEP)) {
      path += "index.html";
    }

    // Redirect /example to /example/
    const info = await Deno.stat(path);

    if (info.isDirectory) {
      return [
        null,
        {
          status: 301,
          headers: {
            "location": join(pathname, "/"),
          },
        },
      ];
    }

    // Serve the static file
    return [
      await Deno.readFile(path),
      {
        status: 200,
        headers: {
          "content-type": mimes.get(extname(path).toLowerCase()) ||
            "application/octet-stream",
        },
      },
    ];
  } catch {
    // Serve pages on demand
    if (router) {
      const result = await router(url);

      if (result) {
        return result;
      }
    }

    // Not found page
    let body: BodyInit = "Not found";

    try {
      body = await Deno.readFile(join(root, page404));
    } catch {
      if (directoryIndex) {
        body = await getDirectoryIndex(root, pathname);
      }
    }

    return [
      body,
      {
        status: 404,
        headers: {
          "content-type": mimes.get(".html")!,
        },
      },
    ];
  }
}

/** Generate the default body for a 404 response */
async function getDirectoryIndex(root: string, file: string): Promise<string> {
  const folders: [string, string][] = [];
  const files: [string, string][] = [];

  try {
    for await (const info of Deno.readDir(join(root, file))) {
      info.isDirectory
        ? folders.push([`${info.name}/`, `📁 ${info.name}/`])
        : files.push([info.name, `📄 ${info.name}`]);
    }
  } catch {
    // It's not a directory
  }

  const content = folders.concat(files);

  if (file.match(/.+\/.+/)) {
    content.unshift(["../", ".."]);
  }

  return `
  <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 - Not found</title>
      <style> body { font-family: sans-serif; max-width: 40em; margin: auto; padding: 2em; line-height: 1.5; }</style>
    </head>
    <body>
      <h1>404 - Not found</h1>
      <p>The URL <code>${file}</code> does not exist</p>
      <ul>
    ${
    content.map(([url, name]) => `
      <li>
        <a href="${url}">
          ${name}
        </a>
      </li>`).join("\n")
  }
      </ul>
    </body>
  </html>`;
}
