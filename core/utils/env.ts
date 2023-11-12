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
