import { DOMParser, HTMLDocument } from "../deps/dom.ts";
import { join, posix, resolve, SEP, toFileUrl } from "../deps/path.ts";
import { exists } from "../deps/fs.ts";
import { parse } from "../deps/jsonc.ts";
import { Exception } from "./errors.ts";
import { encode } from "../deps/base64.ts";

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
    if (value === undefined) {
      continue;
    }

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
const objectConstructor = {}.constructor;

/** Check if the argument passed is a plain object */
export function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === "object" && obj !== null &&
    obj.constructor === objectConstructor &&
    // @ts-ignore: Check if the argument passed is a React element
    obj["$$typeof"] !== reactElement;
}

/**
 * Convert the Windows paths (that use the separator "\")
 * to Posix paths (with the separator "/")
 * and ensure it starts with "/".
 */
export function normalizePath(path: string) {
  if (SEP !== "/") {
    path = path.replaceAll(SEP, "/");

    // Is absolute Windows path (C:/...)
    if (path.includes(":/")) {
      return path;
    }
  }

  return posix.join("/", path);
}

/** Convert an HTMLDocument instance to a string */
export function documentToString(document: HTMLDocument) {
  const { doctype, documentElement } = document;

  if (!doctype) {
    return `<!DOCTYPE html>\n${documentElement?.outerHTML || ""}`;
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

  let global = "";
  try {
    await Promise.any([
      Deno.stat("deno.json"),
      Deno.stat("deno.jsonc"),
    ]);
    await Deno.stat("import_map.json");
  } catch {
    global = " --global";
  }

  const command = (stable ? "lume upgrade" : "lume upgrade --dev") + global;
  return { current, latest, command };
}

/** Returns the _config file of a site */
export async function getConfigFile(
  root: string = Deno.cwd(),
  config?: string,
): Promise<string | undefined> {
  root = resolve(Deno.cwd(), root);

  if (config) {
    const path = join(root, config);

    if (await exists(path)) {
      return path;
    }

    throw new Exception("Config file not found", { path });
  }

  const files = ["_config.js", "_config.ts"];

  for (const file of files) {
    const path = posix.join(root, file);

    if (await exists(path)) {
      return path;
    }
  }
}

/** Basic options for deno.json file */
export interface DenoConfig {
  importMap?: string;
  tasks?: Record<string, string>;
  [key: string]: unknown;
}

/** Return the file name and the content of the deno config file */
export async function getDenoConfig(): Promise<
  { file: string; config: DenoConfig } | undefined
> {
  for (const file of ["deno.json", "deno.jsonc"]) {
    try {
      const content = await Deno.readTextFile(file);
      return { file, config: parse(content) as DenoConfig };
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        continue;
      }

      throw err;
    }
  }
}

export async function loadImportMap(url: URL): Promise<ImportMap> {
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
    const importMap = await loadImportMap(await toUrl(mapFile));

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
  const minimum = "1.24.0";
  const current = Deno.version.deno;

  if (current < minimum) {
    return { current, minimum, command: "deno upgrade" };
  }
}

export function isUrl(path: string): boolean {
  return !!path.match(/^(https?|file):\/\//);
}

export async function toUrl(path: string, resolve = true): Promise<URL> {
  if (isUrl(path)) {
    return new URL(path);
  }

  if (!resolve) {
    return toFileUrl(path);
  }

  return toFileUrl(await Deno.realPath(path));
}

export function createDate(str: string | number): Date | undefined {
  if (typeof str === "number") {
    return new Date(str);
  }

  const datetime = str.match(
    /^(\d{4})-(\d\d)-(\d\d)(?:-(\d\d)-(\d\d)(?:-(\d\d))?)?$/,
  );

  if (datetime) {
    const [, year, month, day, hour, minute, second] = datetime;

    return new Date(Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      hour ? parseInt(hour) : 0,
      minute ? parseInt(minute) : 0,
      second ? parseInt(second) : 0,
    ));
  }

  if (str.match(/^\d+$/)) {
    return new Date(parseInt(str));
  }
}

export async function read(path: string, isBinary: true): Promise<Uint8Array>;
export async function read(path: string, isBinary: false): Promise<string>;
export async function read(
  path: string,
  isBinary: boolean,
): Promise<string | Uint8Array> {
  if (!isUrl(path)) {
    return isBinary ? Deno.readFile(path) : Deno.readTextFile(path);
  }

  const response = await fetch(path);

  return isBinary
    ? new Uint8Array(await response.arrayBuffer())
    : response.text();
}

/** Parse a string as JSX */
export async function parseJSX(
  baseUrl: URL,
  content: string,
  data: Record<string, unknown> = {},
  start = "",
  // deno-lint-ignore no-explicit-any
): Promise<any> {
  // Collect imports
  const imports: string[] = [];

  content = content.replaceAll(
    /import\s+[\w\W]+?\s+from\s+("[^"]+"|'[^']+');?/g,
    (code, path) => {
      // Resolve relative urls
      const quote = path.slice(0, 1);
      let url = path.slice(1, -1);
      if (url.startsWith(".")) {
        url = new URL(url, baseUrl).href;
        code = code.replace(path, quote + url + quote);
      }
      imports.push(code);
      return "";
    },
  ).trim();

  // Destructure arguments
  const destructure = `{${Object.keys(data).join(",")}}`;
  // Keep the curly brakets ({ -> {"{"})
  content = content.replaceAll(/[{}]/g, (char) => `{"${char}"}`);
  // Keep the line breaks (\n -> {"\n"})
  content = content.replaceAll(/(\n\r?)/g, '{"\\n"}');

  const code = `${start}
  ${imports.join("\n")}
  export default async function (${destructure}, helpers) { return <>${content}</> }`;
  const url = `data:text/jsx;base64,${encode(code)}`;
  return (await import(url)).default;
}
