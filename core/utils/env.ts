const envVars = new Map<string, string>();

export function setEnv(name: string, value: string) {
  if (allowedEnvVars()) {
    Deno.env.set(name, value);
  }
  envVars.set(name, value);
}

export function env(name: string): string | undefined {
  return allowedEnvVars()
    ? envVars.get(name) ?? Deno.env.get(name)
    : envVars.get(name);
}

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

let allowed: boolean | undefined;
function allowedEnvVars(): boolean {
  if (allowed === undefined) {
    allowed = Deno.permissions.querySync?.({ name: "env" }).state === "granted";
  }
  return allowed;
}
