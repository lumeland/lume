import { networkInterfaces } from "@lumeland/core/services/net.ts";
import { os, runCommand } from "@lumeland/core/services/process.ts";

export function localIp(): string | undefined {
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
