import { env, setEnv } from "../../deps/runtime.ts";

export { env, setEnv };

export function envBoolean(name: string): boolean | undefined {
  const value = env(name);

  if (typeof value === "undefined") {
    return undefined;
  }

  switch (value.toLowerCase()) {
    case "true":
    case "on":
    case "1":
      return true;

    case "false":
    case "off":
    case "0":
      return false;

    default:
      return undefined;
  }
}

export function envNumber(name: string): number | undefined {
  const value = env(name);

  if (typeof value === "undefined") {
    return undefined;
  }

  const valueNum = +value;
  return Number.isNaN(valueNum) ? undefined : valueNum;
}
