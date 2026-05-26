const ssxElement = Symbol.for("ssx.element");
const objectConstructor = {}.constructor;

/** TypeScript helper to create optional properties recursively */
export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
  }
  : T;

/** Check if the argument passed is a plain object */
export function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === "object" && obj !== null &&
    (obj.constructor === objectConstructor || obj.constructor === undefined) &&
    // @ts-ignore: Check if the argument passed is a SSX element
    obj[ssxElement] !== true &&
    // @ts-ignore: Check if the argument passed is a Page.data object
    obj !== obj.page?.data;
}

/** TypeScript helper to deep merge an optiosn object with some defaults */
export type Merge<T, D extends Partial<T>> = T extends unknown[] ? T
  : T extends object ?
      & T
      & {
        // deno-lint-ignore ban-types
        [K in keyof T & keyof D]: D[K] extends {} ? Merge<T[K], D[K]> : unknown;
      }
  // deno-lint-ignore ban-types
  : D extends {} ? NonNullable<T>
  : T;

/**
 * Merge two objects recursively.
 * It's used to merge user options with default options.
 */
export function merge<Type, Def extends Partial<Type>>(
  defaults: Def,
  user?: Type,
): Merge<Type, Def> {
  const merged = { ...defaults };

  if (!user) {
    return merged as unknown as Merge<Type, Def>;
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

  return merged as unknown as Merge<Type, Def>;
}
