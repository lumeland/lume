import { networkInterfaces } from "../../services/net.ts";
import { os } from "../../services/process.ts";

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

  await new Deno.Command(commands[os()], {
    args: [url],
    stdout: "inherit",
    stderr: "inherit",
  }).output();
}

export function getFreePort(port: number, limit: number): number {
  try {
    const listener = Deno.listen({ port });
    listener.close();
    return port;
  } catch (error) {
    if (error instanceof Deno.errors.AddrInUse) {
      if (port >= limit) {
        throw new Error(`No free port found in the range ${port} to ${limit}`);
      }

      return getFreePort(port + 1, limit);
    }

    throw error;
  }
}
