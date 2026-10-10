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

export interface NetAddress {
  transport: "tcp" | "udp";
  hostname: string;
  port: number;
}

export interface HTTPHandlerInfo {
  remoteAddr: NetAddress;
  completed: Promise<void>;
}

export interface HTTPServer {
  shutdown(): void;
  addr: NetAddress;
}

export interface HTTPServerOptions {
  hostname?: string;
  port?: number;
  signal?: AbortSignal;
  handler: (request: Request, info: HTTPHandlerInfo) => Promise<Response>;
  onListen?: () => void;
  onOpenSocket?: (socket: WebSocket) => void;
}

/** Start a new HTTP server */
export function serve(options: HTTPServerOptions): HTTPServer {
  const { handler, onOpenSocket, ...other } = options;

  const server = Deno.serve(other, (request, info) => {
    if (request.headers.get("upgrade") === "websocket") {
      const { socket, response } = Deno.upgradeWebSocket(request);
      socket.onopen = () => onOpenSocket?.(socket);
      return response;
    }

    return handler(request, info);
  });

  return {
    shutdown: () => server.shutdown(),
    addr: server.addr,
  };
}
