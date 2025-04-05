import { isPlainObject } from "./object.ts";
import { Data } from "../file.ts";

export type MergeStrategy =
  | "array"
  | "stringArray"
  | "object"
  | "data"
  | "none";

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
        case "data":
          if (current[key] && previous[key]) {
            const merged = mergeData(
              { mergedKeys },
              previous[key] as DataToMerge,
              current[key] as DataToMerge,
            );
            data[key] = merged;
          }
          break;
      }
    }

    return data;
  });
}

/** Override some data recursively */
export function overrideData(data: Data, override: Data): void {
  if (!override) {
    return;
  }

  // Merge special keys
  const mergedKeys = {
    ...data.mergedKeys,
    ...override.mergedKeys,
  };

  for (const [key, value] of Object.entries(override)) {
    switch (mergedKeys[key]) {
      case "stringArray":
        data[key] = mergeStringArray(data[key], value);
        break;
      case "array":
        data[key] = mergeArray(data[key], value);
        break;
      case "object":
        data[key] = mergeObject(data[key], value);
        break;
      default:
        if (isPlainObject(data[key]) && isPlainObject(value)) {
          data[key] = mergeRecursiveObjects(data[key], value);
          break;
        }
        if (value !== undefined) {
          data[key] = value;
          break;
        }
    }
  }
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

export function mergeRecursiveObjects(
  target: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const merged = { ...target };

  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(target[key]) && isPlainObject(value)) {
      merged[key] = mergeRecursiveObjects(target[key], value);
      continue;
    }

    if (value !== undefined) {
      merged[key] = value;
    }
  }

  return merged;
}
