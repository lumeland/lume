export function localIp(): string | undefined {
  for (const info of Deno.networkInterfaces()) {
    if (info.family !== "IPv4" || info.address.startsWith("127.")) {
      continue;
    }

    return info.address;
  }
}
