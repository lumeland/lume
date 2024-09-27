export type MergeStrategy = "array" | "stringArray" | "object" | "none";

interface DataToMerge {
  mergedKeys?: Record<string, MergeStrategy>;
  [key: string]: unknown;
}

/** Merge the cascade data */
export function mergeData(...datas: DataToMerge[]): DataToMerge {
  return datas.reduce((previous, current) => {
    const data: DataToMerge = { ...previous, ...current };

    // Merge special keys
    const mergedKeys = {
      ...previous.mergedKeys,
      ...current.mergedKeys,
    };

    for (const [key, type] of Object.entries(mergedKeys)) {
      switch (type) {
        case "stringArray":
          data[key] = mergeStringArray(previous[key], current[key]);
          break;
        case "array":
          data[key] = mergeArray(previous[key], current[key]);
          break;
        case "object":
          data[key] = mergeObject(previous[key], current[key]);
          break;
      }
    }

    return data;
  });
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value)
    ? value
    : (value === undefined || value === null)
    ? []
    : [value];
}

function mergeArray(previous: unknown, current: unknown): unknown[] {
  return [...new Set([...toArray(previous), ...toArray(current)])];
}

function mergeStringArray(previous: unknown, current: unknown): string[] {
  return [...new Set(mergeArray(previous, current).map(String))];
}

function mergeObject(
  previous: unknown,
  current: unknown,
): Record<string, unknown> {
  return { ...previous ?? {}, ...current ?? {} };
}
