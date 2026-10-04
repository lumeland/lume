export interface NetworkInterfaceInfo {
  family: "IPv4" | "IPv6";
  address: string;
}

/** Returns an array with the network interfaces information */
export function networkInterfaces(): NetworkInterfaceInfo[] {
  return Deno.networkInterfaces();
}

/** Check if a port is free */
export function checkPort(port: number): boolean {
  try {
    const listener = Deno.listen({ port });
    listener.close();
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.AddrInUse) {
      return false;
    }

    throw error;
  }
}

/** Upgrade an incoming HTTP request to a WebSocket */
export function upgradeWebSocket(request: Request): [WebSocket, Response] {
  const { socket, response } = Deno.upgradeWebSocket(request);
  return [socket, response];
}
