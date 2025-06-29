const envVars = new Map<string, string>();

export function setEnv(name: string, value: string) {
  if (allowedEnvVars()) {
    Deno.env.set(name, value);
  }
  envVars.set(name, value);
}

export function env<T>(name: string): T | undefined {
  const value = allowedEnvVars()
    ? envVars.get(name) ?? Deno.env.get(name)
    : envVars.get(name);

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

let allowed: boolean | undefined;
function allowedEnvVars(): boolean {
  if (allowed === undefined) {
    allowed = Deno.permissions.querySync?.({ name: "env" }).state === "granted";
  }
  return allowed;
}
