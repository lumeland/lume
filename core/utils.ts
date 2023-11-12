/** Helper to create optional properties recursively */
export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
  }
  : T;

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
