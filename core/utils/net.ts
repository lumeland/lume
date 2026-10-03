import {
  networkInterfaces,
  OS,
  os,
  portIsFree,
  runCommand,
} from "../../deps/runtime.ts";

export function localIp(): string | undefined {
  // Try/catch for https://github.com/denoland/deno/issues/25420
  try {
    for (const info of networkInterfaces()) {
      if (info.family !== "IPv4" || info.address.startsWith("127.")) {
        continue;
      }

      return info.address;
    }
  } catch {
    return undefined;
  }
}

export async function openBrowser(url: string): Promise<void> {
  const commands: Record<OS, string> = {
    darwin: "open",
    linux: "xdg-open",
    freebsd: "xdg-open",
    netbsd: "xdg-open",
    aix: "xdg-open",
    solaris: "xdg-open",
    illumos: "xdg-open",
    windows: "explorer",
    android: "xdg-open",
  };

  await runCommand(commands[os()], [url]);
}

export function getFreePort(port: number, limit: number): number {
  for (; port <= limit; ++port) {
    if (portIsFree(port)) {
      return port;
    }
  }

  throw new Error(`No free port found in the range ${port} to ${limit}`);
}
