import { parseArgs } from "./deps/cli.ts";
import { stripAnsiCode } from "./deps/colors.ts";

// Capture flags to pass to the server
const flags = parseArgs(Deno.args, {
  string: ["port", "hostname"],
  boolean: ["show-terminal"],
  default: {
    port: "3000",
    hostname: "localhost",
    showTerminal: false,
  },
});

export function getServeHandler(): Deno.ServeHandler {
  const { port, hostname, "show-terminal": showTerminal } = flags;

  let process:
    | { process: Deno.ChildProcess; ready: boolean; error: boolean }
    | undefined;
  let timeout: number | undefined;

  return async function (request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Start the server on the first request
    if (!process?.ready) {
      const body = new BodyStream();
      body.message(`
        <html><head><title>Starting...</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script>setInterval(() => window.scroll({top:document.documentElement.scrollHeight,behavior:"instant"}), 10);</script>
        <style>
        body {
          font-family: sans-serif;
          margin: 0;
          padding: 2rem;
          box-sizing: border-box;
          display: grid;
          grid-template-columns: minmax(0, 800px);
          align-content: center;
          justify-content: center;
          min-height: 100vh
        }
        pre {
          overflow-x: auto;
        }
        </style></head><body><pre><samp>Initializing. Please wait...`);

      startServer(url, body).then(() => {
        if (process?.error) {
          body.message("Error starting the server");
          body.close();
          process = undefined;
          return;
        }
        body.message("</pre></samp><script>location.reload()</script>");
        body.close();
      });
      return new Response(body.body, {
        status: 200,
        headers: {
          "Content-Type": "text/html",
          "Transfer-Encoding": "chunked",
        },
      });
    }

    // Close the server after 2 hours of inactivity
    clearTimeout(timeout);
    timeout = setTimeout(closeServer, 2 * 60 * 60 * 1000);

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
      closeServer();
    }

    return response;
  };

  // Start the server
  async function startServer(location: URL, body: BodyStream): Promise<void> {
    if (process?.ready === false) {
      return;
    }

    console.log(`Start proxied server on port ${port}`);

    const command = new Deno.Command(Deno.execPath(), {
      env: {
        ...Deno.env.toObject(),
        LUME_PROXIED: "true",
      },
      stdout: showTerminal ? "piped" : "inherit",
      stderr: showTerminal ? "piped" : "inherit",
      args: [
        "task",
        "lume",
        "--serve",
        "--cms",
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
        closeServer();
      }
    });

    body.chunk("Building the site...");

    if (showTerminal) {
      body.readStd(process.process.stdout);
      body.readStd(process.process.stderr);
    }

    // Wait for the server to start
    const timeout = 1000;
    while (true) {
      if (process.error) {
        return;
      }

      if (!showTerminal) {
        body.chunk(".");
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

  // Close the server
  function closeServer() {
    try {
      process?.process.kill();
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

class BodyStream {
  #timer: number | undefined = undefined;
  #chunks: string[] = [];
  #body: ReadableStream | undefined;
  #closed = false;

  get body() {
    return this.#body;
  }

  constructor() {
    this.#body = new ReadableStream({
      start: (controller) => {
        this.#timer = setInterval(() => {
          try {
            while (this.#chunks.length > 0) {
              const message = this.#chunks.shift();
              controller.enqueue(new TextEncoder().encode(message));
            }
          } catch {
            // The stream controller cannot close or enqueue
          }
          if (this.#closed) {
            clearInterval(this.#timer);
            try {
              controller.close();
            } catch {
              // The stream controller cannot close or enqueue
            }
          }
        }, 100);
      },
      cancel: () => {
        this.close();
      },
    });
  }

  readStd(stream: ReadableStream) {
    stream.pipeThrough(new TextDecoderStream()).pipeTo(
      new WritableStream({
        write: (chunk) => {
          this.chunk(stripAnsiCode(chunk));
        },
      }),
    );
  }

  chunk(message: string) {
    this.#chunks.push(message);
  }

  message(message: string) {
    this.chunk(message + "\n");
  }

  close() {
    this.#closed = true;
  }
}
