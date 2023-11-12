import { cyan, green, red } from "../deps/colors.ts";
import { posix, SEP } from "../deps/path.ts";

/** A list of the available optional plugins */
export const pluginNames = [
  "attributes",
  "base_path",
  "code_highlight",
  "date",
  "esbuild",
  "eta",
  "favicon",
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
  "decap_cms",
  "on_demand",
  "pagefind",
  "picture",
  "postcss",
  "prism",
  "pug",
  "reading_info",
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
  "unocss",
  "vento",
];

/** Check the compatibility with the current Deno version */
export function checkDenoVersion(): void {
  const minimum = "1.37.2";
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
): Required<Type> {
  const merged = { ...defaults };

  if (!user) {
    return merged as unknown as Required<Type>;
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

  return merged as unknown as Required<Type>;
}

const reactElement = Symbol.for("react.element");
const objectConstructor = {}.constructor;

/** Check if the argument passed is a plain object */
export function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === "object" && obj !== null &&
    obj.constructor === objectConstructor &&
    // @ts-ignore: Check if the argument passed is a React element
    obj["$$typeof"] !== reactElement &&
    // @ts-ignore: Check if the argument passed is a Page.data object
    obj !== obj.page?.data;
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

export function isUrl(path: string): boolean {
  return !!path.match(/^(https?|file):\/\//);
}
export function isAbsolutePath(path: string): boolean {
  return SEP !== "/" ? /^\w:[\/\\]/.test(path) : path.startsWith("/");
}

export function replaceExtension(
  path: string,
  ext: string,
): string {
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

export function env<T>(name: string): T | undefined {
  const value = Deno.env.get(name);

  if (typeof value === "undefined") {
    return undefined;
  }

  switch (value.toLowerCase()) {
    case "true":
    case "on":
    case "1":
      return true as T;

    case "false":
    case "off":
    case "0":
      return false as T;

    default:
      return value as T;
  }
}
