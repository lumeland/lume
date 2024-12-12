export function localIp(): string | undefined {
  // Try/catch for https://github.com/denoland/deno/issues/25420
  try {
    for (const info of Deno.networkInterfaces()) {
      if (info.family !== "IPv4" || info.address.startsWith("127.")) {
        continue;
      }

      return info.address;
    }
  } catch {
    return undefined;
  }
}
