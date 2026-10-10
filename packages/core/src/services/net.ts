import { createServer } from "node:http";
import { networkInterfaces as getNetWorkInterfaces } from "node:os";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { WebSocketServer } from "ws";

import type { IncomingMessage, ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

export interface NetworkInterfaceInfo {
  family: "IPv4" | "IPv6";
  address: string;
}

/** Returns an array with the network interfaces information */
export function networkInterfaces(): NetworkInterfaceInfo[] {
  const result: NetworkInterfaceInfo[] = [];

  for (const [, infos] of Object.entries(getNetWorkInterfaces())) {
    if (!infos) continue;

    for (const { family, address } of infos) {
      result.push({ family, address });
    }
  }

  return result;
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
  onUpgradeWebSocket?: (socket: WebSocket) => void;
}

/** Start a new HTTP server */
export function serve(options: HTTPServerOptions): HTTPServer {
  const {
    handler,
    hostname = "0.0.0.0",
    port = 8000,
    signal,
    onListen,
    onUpgradeWebSocket,
  } = options;

  const server = createServer(async (req, res) => {
    const completed = new Promise<void>((resolve) => req.on("close", () => resolve()));
    try {
      const request = toRequest(req, res, port);
      const info: HTTPHandlerInfo = {
        remoteAddr: {
          transport: "tcp",
          hostname: req.socket.remoteAddress ?? "",
          port: req.socket.remotePort ?? 0,
        },
        completed,
      };
      const response = await handler(request, info);
      await sendResponse(response, res);
    } catch (error) {
      console.error(error);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("Internal Server Error");
      } else {
        res.destroy();
      }
    }
  });

  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => onUpgradeWebSocket?.(ws as unknown as WebSocket));

  const addr: NetAddress = { transport: "tcp", hostname, port };
  server.listen(port, hostname, () => {
    const info = server.address() as AddressInfo;
    addr.hostname = info.address;
    addr.port = info.port;
    onListen?.();
  });

  function shutdown() {
    server.close();
    server.closeAllConnections();
  }
  if (signal) {
    if (signal.aborted) shutdown();
    else signal.addEventListener("abort", shutdown, { once: true });
  }
  return { shutdown, addr };
}

function toRequest(req: IncomingMessage, res: ServerResponse, port: number): Request {
  const protocol = "http";
  const host = req.headers.host ?? `localhost:${port}`;
  const url = new URL(req.url ?? "/", `${protocol}://${host}`);
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }

  const controller = new AbortController();
  res.on("close", () => {
    if (!res.writableFinished) controller.abort();
  });
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  return new Request(url, {
    method: req.method,
    headers,
    body: hasBody ? (Readable.toWeb(req) as ReadableStream) : null,
    signal: controller.signal,
    // @ts-expect-error required by Node (undici) when sending a stream body
    duplex: "half",
  });
}

async function sendResponse(response: Response, res: ServerResponse): Promise<void> {
  res.statusCode = response.status;
  if (response.statusText) {
    res.statusMessage = response.statusText;
  }

  for (const [key, value] of response.headers) {
    if (key.toLowerCase() === "set-cookie") {
      res.setHeader(key, response.headers.getSetCookie());
      continue;
    }
    res.setHeader(key, value);
  }

  if (!response.body) {
    res.end();
    return;
  }

  await pipeline(Readable.fromWeb(response.body as any), res);
}
