import Server from "@lumeland/core/server.ts";

export function getServer(handler?: (request: Request) => Response | Promise<Response>) {
  handler ??= () => Promise.resolve(new Response("OK", { status: 200 }));

  return new Server({
    port: 8000,
    async serveFile(_, request) {
      return await handler(request);
    },
  });
}

export async function send(server: Server, requestOrUrl?: Request | string | URL) {
  const request =
    requestOrUrl instanceof Request
      ? requestOrUrl
      : new Request(requestOrUrl ?? "http://localhost");
  const response = await server.handle(request, {
    remoteAddr: {
      transport: "tcp",
      hostname: server.hostname,
      port: server.port,
    },
    completed: Promise.resolve(),
  });

  const body = await response.text();
  const headers = Object.fromEntries(response.headers.entries());

  return {
    request: request.url,
    method: request.method,
    status: response.status,
    statusText: response.statusText,
    headers,
    body,
  };
}
