const envVars = new Map<string, string>();

export function setEnv(name: string, value: string) {
  // Deno Deploy doesn't support permissions.requestSync
  // https://github.com/denoland/deploy_feedback/issues/527
  if (Deno.permissions.querySync?.({ name: "env" }).state === "granted") {
    Deno.env.set(name, value);
  } else {
    envVars.set(name, value);
  }
}

export function env<T>(name: string): T | undefined {
  if (envVars.has(name)) {
    return envVars.get(name) as T;
  }

  // Deno Deploy doesn't support permissions.requestSync
  // https://github.com/denoland/deploy_feedback/issues/527
  const allowed = !Deno.permissions.requestSync ||
    Deno.permissions.requestSync({ name: "env" }).state === "granted";

  if (!allowed) {
    return undefined;
  }

  const value = envVars.has(name) ? envVars.get(name) : Deno.env.get(name);

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
