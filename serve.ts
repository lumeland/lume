import { parseArgs } from "./deps/cli.ts";

// Capture flags to pass to the server
const flags = parseArgs(Deno.args, {
  string: ["port", "hostname"],
  default: {
    port: "3000",
    hostname: "localhost",
    showTerminal: false,
  },
});

export function getServeHandler(): Deno.ServeHandler {
  const { port, hostname } = flags;

  let process:
    | { process: Deno.ChildProcess; ready: boolean; error: boolean }
    | undefined;
  let timeout: number | undefined;

  return async function (request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Start the server on the first request
    if (!process?.ready) {
      return startServer(url);
    }

    // Close the server after 2 hours of inactivity
    clearTimeout(timeout);
    timeout = setTimeout(closeServerProcess, 2 * 60 * 60 * 1000);

    // Forward the request to the server
    url.port = port;

    const headers = new Headers(request.headers);
    headers.set("host", url.host);
    headers.set("origin", url.origin);

    if (headers.get("upgrade") === "websocket") {
      return proxyWebSocket(request);
    }

    const response = await fetch(url, {
      redirect: "manual",
      headers,
      method: request.method,
      body: request.body,
    });

    // Close the server if the response header tells us to
    if (response.headers.get("X-Lume-CMS") === "reload") {
      await closeServerProcess();
      const url = response.headers.get("X-Lume-Location") ||
        response.headers.get("Location") || request.url;
      return startServer(new URL(url, request.url));
    }

    return response;
  };

  async function startServer(url: URL): Promise<Response> {
    await startProcess(url);

    if (process?.error) {
      process = undefined;
      return new Response("Error starting the server", { status: 500 });
    }

    const body = `<head><meta http-equiv="refresh" content="0"></head>`;
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    });
  }

  // Start the server process
  async function startProcess(location: URL): Promise<void> {
    if (process?.ready === false) {
      return;
    }

    console.log(`Start proxied server on port ${port}`);

    const command = new Deno.Command(Deno.execPath(), {
      env: {
        ...Deno.env.toObject(),
        LUME_PROXIED: "true",
      },
      stdout: "inherit",
      stderr: "inherit",
      args: [
        "task",
        "lume",
        "--serve",
        `--port=${port}`,
        `--hostname=${hostname}`,
        `--location=${location.origin}`,
      ],
    });

    process = {
      process: command.spawn(),
      ready: false,
      error: false,
    };

    process.process.status.then((status) => {
      if (process && status.success === false && status.signal !== "SIGTERM") {
        process!.error = true;
      } else {
        closeServerProcess();
      }
    });

    // Wait for the server to start
    const timeout = 1000;
    while (true) {
      if (process.error) {
        return;
      }

      try {
        await fetch(`http://${hostname}:${port}`);
        process.ready = true;
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, timeout));
      }
    }
  }

  // Close the server process
  async function closeServerProcess() {
    try {
      if (process) {
        process.process.kill();
        await process.process.output();
      }
    } catch {
      // The process is already dead
    }

    process = undefined;
  }

  // Proxy the WebSocket connection
  function proxyWebSocket(request: Request) {
    const { socket, response } = Deno.upgradeWebSocket(request);
    const { pathname } = new URL(request.url);
    const origin = new WebSocket(`ws://${hostname}:${port}${pathname}`);

    origin.onopen = () => {
      socket.onmessage = (event) => origin.send(event.data);
      origin.onmessage = (event) => socket.send(event.data);
      socket.onclose = () => origin.close();
      origin.onclose = () => socket.close();
    };

    return response;
  }
}

export default {
  fetch: getServeHandler(),
};
