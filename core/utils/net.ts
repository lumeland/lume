import { checkPort, networkInterfaces } from "../../services/net.ts";
import { os, runCommand } from "../../services/process.ts";

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
  const commands: Record<ReturnType<typeof os>, string> = {
    darwin: "open",
    unix: "xdg-open",
    windows: "explorer",
  };

  await runCommand(commands[os()], [url]);
}

export function getFreePort(port: number, limit: number): number {
  for (; port <= limit; ++port) {
    if (checkPort(port)) {
      return port;
    }
  }

  throw new Error(`No free port found in the range ${port} to ${limit}`);
}
