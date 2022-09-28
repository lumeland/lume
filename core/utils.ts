import { DOMParser, HTMLDocument } from "../deps/dom.ts";
import {
  brightGreen,
  brightYellow,
  cyan,
  dim,
  green,
  red,
} from "../deps/colors.ts";
import { dirname, extname, join, posix, SEP } from "../deps/path.ts";
import { parse } from "../deps/jsonc.ts";
import { Exception } from "./errors.ts";

/** A list of the available optional plugins */
export const pluginNames = [
  "attributes",
  "base_path",
  "code_highlight",
  "date",
  "esbuild",
  "eta",
  "imagick",
  "inline",
  "jsx",
  "jsx_preact",
  "katex",
  "lightningcss",
  "liquid",
  "metas",
  "minify_html",
  "modify_urls",
  "multilanguage",
  "netlify_cms",
  "on_demand",
  "pagefind",
  "postcss",
  "prism",
  "pug",
  "relations",
  "relative_urls",
  "remark",
  "resolve_urls",
  "sass",
  "sheets",
  "slugify_urls",
  "svgo",
  "terser",
  "windi_css",
];

/** A list of the available plugins with init configurations */
export const initPlugins = [
  "jsx",
  "jsx_preact",
];

export function log(...lines: (string | undefined)[]) {
  console.log("----------------------------------------");
  lines.forEach((line) => line && console.log(line));
  console.log("----------------------------------------");
}

export function promptConfigUpdate(data: unknown) {
  log(
    red("deno.jsonc needs to be manually updated:"),
    dim("Use deno.json to update it automatically"),
    JSON.stringify(data, null, 2),
  );
}

/** Check the compatibility with the current Deno version */
export function checkDenoVersion(): void {
  const minimum = "1.25.4";
  const current = Deno.version.deno;

  if (current < minimum) {
    console.log("----------------------------------------");
    console.error(red("Your Deno version is not compatible with Lume"));
    console.log(`Lume needs Deno ${green(minimum)} or greater`);
    console.log(`Your current version is ${red(current)}`);
    console.log(`Run ${cyan("deno upgrade")} and try again`);
    console.log("----------------------------------------");
    Deno.exit(1);
  }
}

/** Check if the current version is outdated */
export async function checkUpgrade(): Promise<void> {
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

  let global = false;
  try {
    await Promise.any([
      Deno.stat("deno.json"),
      Deno.stat("deno.jsonc"),
    ]);
    await Deno.stat("import_map.json");
  } catch {
    global = true;
  }

  const command = global
    ? (stable ? "lume upgrade --global" : "lume upgrade --dev --global")
    : (stable ? "deno task lume upgrade" : "deno task lume upgrade --dev");

  log(
    `Update available ${dim(current)}  → ${green(latest)}`,
    `Run ${cyan(command)} to update`,
  );
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
    try {
      return await Deno.realPath(path);
    } catch (cause) {
      throw new Exception("Config file not found", { path, cause });
    }
  }

  const paths = ["_config.js", "_config.ts"];

  for (const path of paths) {
    try {
      return await Deno.realPath(path);
    } catch {
      // Ignore
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
