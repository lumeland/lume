import { DOMParser, HTMLDocument } from "../deps/dom.ts";
import { brightGreen, cyan, dim, gray, green, red } from "../deps/colors.ts";
import { dirname, extname, join, posix, SEP } from "../deps/path.ts";
import { parse } from "../deps/jsonc.ts";

/** A list of the available optional plugins */
export const pluginNames = [
  "attributes",
  "base_path",
  "code_highlight",
  "date",
  "esbuild",
  "eta",
  "feed",
  "filter_pages",
  "imagick",
  "inline",
  "jsx",
  "jsx_preact",
  "katex",
  "lightningcss",
  "liquid",
  "mdx",
  "metas",
  "minify_html",
  "modify_urls",
  "multilanguage",
  "nav",
  "netlify_cms",
  "on_demand",
  "pagefind",
  "picture",
  "postcss",
  "prism",
  "pug",
  "relations",
  "relative_urls",
  "remark",
  "resolve_urls",
  "sass",
  "sheets",
  "sitemap",
  "slugify_urls",
  "source_maps",
  "svgo",
  "tailwindcss",
  "terser",
  "toml",
  "vento",
  "windi_css",
];

export function log(...lines: (string | undefined)[]) {
  console.log("----------------------------------------");
  lines.forEach((line) => line && console.log(line));
  console.log("----------------------------------------");
}

/** Check the compatibility with the current Deno version */
export function checkDenoVersion(): void {
  const minimum = "1.33.4";
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

  const command = "deno task lume upgrade" + (stable ? "" : " --dev");

  log(
    `Update available ${dim(current)} → ${green(latest)}`,
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
export async function getLatestDevelopmentVersion(
  branch = "master",
): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/lumeland/lume/commits/${branch}`,
  );
  const commits = await response.json();
  return commits.sha;
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
export function normalizePath(path: string, rootToRemove?: string) {
  if (rootToRemove) {
    path = path.replace(rootToRemove, "");
  }

  if (SEP !== "/") {
    path = path.replaceAll(SEP, "/");

    // Is absolute Windows path (C:/...)
    if (path.includes(":/")) {
      if (rootToRemove && path.startsWith(rootToRemove)) {
        return posix.join("/", path.replace(rootToRemove, ""));
      }

      return path;
    }
  }

  const absolute = posix.join("/", path);
  return rootToRemove && absolute.startsWith(rootToRemove)
    ? posix.join("/", absolute.replace(rootToRemove, ""))
    : absolute;
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
    } catch {
      throw new Error(`Config file not found (${path})`);
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
export async function readDenoConfig(): Promise<DenoConfigResult | undefined> {
  for (const file of ["deno.json", "deno.jsonc"]) {
    try {
      const content = await Deno.readTextFile(file);
      const config = parse(content) as DenoConfig;
      let importMap: ImportMap | undefined;

      if (config.importMap) {
        importMap = isUrl(config.importMap)
          ? await (await fetch(config.importMap)).json()
          : await JSON.parse(await Deno.readTextFile(config.importMap));
      } else if (config.imports) {
        importMap = {
          imports: config.imports as Record<string, string>,
          scopes: config.scopes as Record<string, Record<string, string>>,
        };
      }
      return { file, config, importMap };
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        continue;
      }

      throw err;
    }
  }
}

export function updateLumeVersion(url: URL, denoConfig: DenoConfigResult) {
  denoConfig.importMap ??= { imports: {} };

  const { config, importMap } = denoConfig;

  // Configure the import map
  if (Deno.version.deno < "1.30.0") {
    config.importMap ||= "./import_map.json";
  }

  const oldUrl = importMap.imports["lume/"];
  const newUrl = new URL("./", url).href;
  importMap.imports["lume/"] = newUrl;

  for (const [specifier, url] of Object.entries(importMap.imports)) {
    if (url.startsWith(oldUrl)) {
      importMap.imports[specifier] = url.replace(oldUrl, newUrl);
    }
  }

  // Configure lume tasks
  const tasks = config.tasks || {};
  if (!tasks.lume || !tasks.lume.includes(`echo "import 'lume/cli.ts'"`)) {
    tasks.lume = `echo "import 'lume/cli.ts'" | deno run --unstable -A -`;
    tasks.build = "deno task lume";
    tasks.serve = "deno task lume -s";
  }
  config.tasks = tasks;
}

/** Update the Deno configuration */
export async function writeDenoConfig(options: DenoConfigResult) {
  const { file, config, importMap } = options;

  if (importMap && !config.importMap) {
    config.imports = importMap.imports;
    config.scopes = importMap.scopes;
  }

  if (config.importMap) {
    const importMapFile = join(dirname(file), config.importMap);
    await Deno.writeTextFile(
      importMapFile,
      JSON.stringify(importMap, null, 2) + "\n",
    );
    console.log(brightGreen("Import map file saved:"), importMapFile);
  }

  if (extname(file) === ".jsonc") {
    const save = confirm(
      "Saving the deno.jsonc file will overwrite the comments. Continue?",
    );

    if (!save) {
      console.log(
        "You have to update your deno.jsonc file manually with the following content:",
      );
      console.log(dim(JSON.stringify(config, null, 2)));
      console.log("Use deno.json to update it automatically without asking.");
      return;
    }
  }
  await Deno.writeTextFile(file, JSON.stringify(config, null, 2) + "\n");
  console.log("Deno configuration file saved:", gray(file));
}

export function isUrl(path: string): boolean {
  return !!path.match(/^(https?|file):\/\//);
}
export function isAbsolutePath(path: string): boolean {
  return SEP !== "/" ? /^\w:[\/\\]/.test(path) : path.startsWith("/");
}

export function replaceExtension(
  path: string | false,
  ext: string,
): string | false {
  if (!path) {
    return false;
  }
  return path.replace(/\.\w+$/, ext);
}

export function getPathAndExtension(path: string): [string, string] {
  const extension = getExtension(path);
  const pathWithoutExtension = path.slice(0, -extension.length);
  return [pathWithoutExtension, extension];
}

export function getExtension(path: string): string {
  const match = path.match(/\.\w+$/);
  return match ? match[0] : "";
}

export async function read(
  path: string,
  isBinary: boolean,
): Promise<Uint8Array | string>;
export async function read(
  path: string,
  isBinary: true,
  init?: RequestInit,
): Promise<Uint8Array>;
export async function read(
  path: string,
  isBinary: false,
  init?: RequestInit,
): Promise<string>;
export async function read(
  path: string,
  isBinary: boolean,
  init?: RequestInit,
): Promise<string | Uint8Array> {
  if (!isUrl(path)) {
    if (path.startsWith("data:")) {
      const response = await fetch(path);

      return isBinary
        ? new Uint8Array(await response.arrayBuffer())
        : response.text();
    }

    return isBinary ? Deno.readFile(path) : Deno.readTextFile(path);
  }

  const url = new URL(path);

  if (url.protocol === "file:") {
    return isBinary ? Deno.readFile(url) : Deno.readTextFile(url);
  }

  const cache = await caches.open("lume_remote_files");

  // Prevent https://github.com/denoland/deno/issues/19696
  try {
    const cached = await cache.match(url);

    if (cached) {
      return isBinary
        ? new Uint8Array(await cached.arrayBuffer())
        : cached.text();
    }
  } catch {
    // ignore
  }

  const response = await fetch(url, init);
  await cache.put(url, response.clone());

  return isBinary
    ? new Uint8Array(await response.arrayBuffer())
    : response.text();
}

/**
 * Check if the content variable is a generator.
 */
export function isGenerator(
  content: unknown,
): content is GeneratorFunction | AsyncGeneratorFunction {
  if (typeof content !== "function") {
    return false;
  }

  const name = content.constructor.name;
  return (name === "GeneratorFunction" || name === "AsyncGeneratorFunction");
}

/**
 * Resolve the path of an included file
 * Used in the template engines and processors
 */
export function resolveInclude(
  path: string,
  includesDir: string,
  fromDir?: string,
  rootToRemove?: string,
): string {
  if (isUrl(path)) {
    return path;
  }

  if (path.startsWith(".")) {
    if (!fromDir) {
      throw new Error(`Cannot load "${path}" without a base directory`);
    }

    return normalizePath(posix.join(fromDir, path), rootToRemove);
  }

  const normalized = normalizePath(path, rootToRemove);

  return normalized.startsWith(normalizePath(posix.join(includesDir, "/")))
    ? normalized
    : normalizePath(posix.join(includesDir, normalized));
}
