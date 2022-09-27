import { DOMParser, HTMLDocument } from "../deps/dom.ts";
import { brightGreen, brightYellow } from "../deps/colors.ts";
import { dirname, extname, join, posix, SEP } from "../deps/path.ts";
import { exists } from "../deps/fs.ts";
import { parse } from "../deps/jsonc.ts";
import { Exception } from "./errors.ts";
import { encode } from "../deps/base64.ts";

/** Import map file */
export interface ImportMap {
  imports: Record<string, string>;
  scopes?: Record<string, Record<string, string>>;
}

/** Basic options for deno.json file */
export interface DenoConfig {
  importMap?: string;
  tasks?: Record<string, string>;
  compilerOptions?: {
    jsx?: "jsx" | "react-jsx";
    jsxImportSource?: string;
  };
  [key: string]: unknown;
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

/** Helper to create optional properties recursively */
// deno-lint-ignore ban-types
export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
  }
  : T;

/**
 * Merge two objects recursively.
 * It's used to merge user options with default options.
 */
export function merge<Type>(
  defaults: Type,
  user?: Partial<Type> | DeepPartial<Type>,
): Type {
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
export function getLumeVersion(
  url = new URL(import.meta.resolve("../")),
): string {
  const { pathname } = url;
  return pathname.match(/@([^/]+)/)?.[1] ?? `local (${pathname})`;
}

/** Returns the _config file of a site */
export async function getConfigFile(
  path?: string,
): Promise<string | undefined> {
  if (path) {
    if (await exists(path)) {
      return path;
    }

    throw new Exception("Config file not found", { path });
  }

  const paths = ["_config.js", "_config.ts"];

  for (const path of paths) {
    if (await exists(path)) {
      return path;
    }
  }
}

export interface DenoConfigResult {
  file: string;
  config: DenoConfig;
  importMap?: ImportMap;
}

/** Detect and returns the Deno configuration */
export async function readDenoConfig(
  importMapFile?: string,
): Promise<DenoConfigResult | undefined> {
  for (const file of ["deno.json", "deno.jsonc"]) {
    try {
      const content = await Deno.readTextFile(file);
      const config = parse(content) as DenoConfig;
      importMapFile ||= config.importMap;
      if (importMapFile) {
        config.importMap = importMapFile;
        const importMap: ImportMap = isUrl(importMapFile)
          ? await (await fetch(importMapFile)).json()
          : await JSON.parse(await Deno.readTextFile(importMapFile));

        return { file, config, importMap };
      }
      return { file, config };
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        continue;
      }

      throw err;
    }
  }
}

/** Update the Deno configuration */
export async function writeDenoConfig(options: DenoConfigResult) {
  const { file, config, importMap } = options;

  if (importMap && !config.importMap) {
    config.importMap = "./import_map.json";
  }

  if (config.importMap) {
    const importMapFile = join(dirname(file), config.importMap);
    console.log(importMapFile);

    await Deno.writeTextFile(
      importMapFile,
      JSON.stringify(importMap, null, 2) + "\n",
    );
    console.log(brightGreen("Import map file saved:"), importMapFile);
  }

  if (extname(file) === ".jsonc") {
    console.log(
      brightYellow("deno.jsonc needs to be manually updated:"),
      "Use deno.json to update it automatically",
      JSON.stringify(config, null, 2),
    );
  } else {
    await Deno.writeTextFile(file, JSON.stringify(config, null, 2) + "\n");
    console.log(brightGreen("Deno configuration file saved:"), file);
  }
}

export function isUrl(path: string): boolean {
  return !!path.match(/^(https?|file):\/\//);
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
