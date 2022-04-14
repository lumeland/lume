import { DOMParser, HTMLDocument } from "../deps/dom.ts";
import { SEP, toFileUrl } from "../deps/path.ts";

export const baseUrl = new URL("../", import.meta.url);

// TODO: Remove this once Deno.ImportMap is available
interface ImportMap {
  imports: Record<string, string>;
  scopes?: Record<string, Record<string, string>>;
}

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
  return typeof obj === "object" && obj !== null && !Array.isArray(obj) &&
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

/** Return the current installed version */
export function getLumeVersion(url = baseUrl): string {
  const { pathname } = url;
  return pathname.match(/@([^/]+)/)?.[1] ?? `local (${pathname})`;
}

/** Return the latest stable version from the deno.land/x repository */
export async function getLatestVersion(): Promise<string> {
  const response = await fetch("https://cdn.deno.land/lume/meta/versions.json");
  const versions = await response.json();
  return versions.latest;
}

/** Return the hash of the latest commit from the GitHub repository */
export async function getLatestDevelopmentVersion(): Promise<string> {
  const response = await fetch(
    "https://api.github.com/repos/lumeland/lume/commits?per_page=1",
  );
  const commits = await response.json();
  return commits[0].sha;
}

export interface UpgradeInfo {
  current: string;
  latest: string;
  command: string;
}

export async function mustNotifyUpgrade(): Promise<undefined | UpgradeInfo> {
  const current = getLumeVersion();

  // It's a local version
  if (current.startsWith("local ")) {
    return;
  }

  const stable = !!current.match(/^v\d+\./);

  const expires = 1000 * 60 * 60 * 24; // 1 day
  const interval = localStorage.getItem("lume-upgrade");

  if (interval && parseInt(interval) + expires > Date.now()) {
    return;
  }

  localStorage.setItem("lume-upgrade", Date.now().toString());

  const latest = stable
    ? await getLatestVersion()
    : await getLatestDevelopmentVersion();

  if (current === latest) {
    return;
  }

  const command = stable ? "lume upgrade" : "lume upgrade --dev";
  return { current, latest, command };
}

/** Basic options for deno.json file */
export interface DenoConfig {
  importMap?: string;
  tasks?: Record<string, string>;
  [key: string]: unknown;
}

export async function getDenoConfig(): Promise<DenoConfig | undefined> {
  try {
    const content = await Deno.readTextFile("deno.json");
    return JSON.parse(content) as DenoConfig;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return;
    }

    throw err;
  }
}

export async function loadImportMap(mapFile: string): Promise<ImportMap> {
  const url = await toUrl(mapFile);
  return await (await fetch(url)).json() as ImportMap;
}

/**
 * Return a data url with the import map of Lume
 * Optionally merge it with a custom import map from the user
 */
export async function getImportMap(mapFile?: string): Promise<ImportMap> {
  const map: ImportMap = {
    imports: {
      "lume/": new URL("./", baseUrl).href,
    },
  };

  if (mapFile) {
    const importMap = await loadImportMap(mapFile);

    map.imports = { ...importMap.imports, ...map.imports };
    map.scopes = importMap.scopes;
  }

  return map;
}

export type SpecifierMap = Record<string, string>;

/** Check the compatibility with the current Deno version */
export interface DenoInfo {
  current: string;
  minimum: string;
  command: string;
}

export function checkDenoVersion(): DenoInfo | undefined {
  const minimum = "1.20.1";
  const current = Deno.version.deno;

  if (current < minimum) {
    return { current, minimum, command: "deno upgrade" };
  }
}

export async function toUrl(path: string): Promise<URL> {
  if (path.match(/https?:\/\//)) {
    return new URL(path);
  }

  return toFileUrl(await Deno.realPath(path));
}
