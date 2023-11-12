import { posix, SEP } from "../deps/path.ts";

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
