import { posix } from "../deps/path.ts";
import Events from "./events.ts";
import { serveFile as httpServeFile } from "../deps/http.ts";
import { decodeURIComponentSafe } from "./utils/path.ts";
import { merge } from "./utils/object.ts";
import { cwd, serve, stat } from "../deps/runtime.ts";

import type { RTServer } from "../deps/runtime.ts";
import type { Event, EventListener, EventOptions } from "./events.ts";

/** The options to configure the local server */
export interface Options {
  /** The root path */
  root: string;
  port?: number;
  hostname?: string;
  serveFile?: (root: string, request: Request) => Promise<Response>;
  signal?: AbortSignal;
}

export const defaults: Options = {
  root: `${cwd()}/_site`,
  port: 8000,
  serveFile,
};

export interface NetAddress {
  transport: "tcp" | "udp";
  hostname: string;
  port: number;
}

export interface HandlerInfo {
  /** The remote address of the connection. */
  remoteAddr: NetAddress;
  /** The completion promise */
  completed: Promise<void>;
}

export type RequestHandler = (req: Request) => Promise<Response>;
export type Middleware = (
  req: Request,
  next: RequestHandler,
  info: HandlerInfo,
) => Promise<Response>;

/** Custom events for server */
export interface ServerEvent extends Event {
  /** The event type */
  type: ServerEventType;

  /** The request object */
  request?: Request;

  /** The error object (only for "error" events) */
  error?: Error;
}

/** The available event types */
export type ServerEventType =
  | "start"
  | "error";

export default class Server {
  events: Events<ServerEvent> = new Events<ServerEvent>();
  options: Required<Options>;
  middlewares: Middleware[] = [];
  fetch: (request: Request, info: HandlerInfo) => Promise<Response>;
  #server?: RTServer;
  #waiting = false;

  constructor(options: Partial<Options> = {}) {
    this.options = merge(defaults, options);

    if (this.options.hostname === "localhost") {
      this.options.hostname = "0.0.0.0";
    }

    // Create the fetch function for `deno serve`
    this.fetch = (request: Request, info: HandlerInfo) => {
      return this.handle(request, info);
    };
  }

  /** The local address this server is listening on. */
  get addr(): NetAddress | undefined {
    return this.#server?.addr;
  }

  /** Register one or more middlewares */
  use(...middleware: Middleware[]) {
    this.middlewares.push(...middleware);
    return this;
  }

  /** Register one or more middlewares at the beginning of the list */
  useFirst(...middleware: Middleware[]) {
    this.middlewares.unshift(...middleware);
    return this;
  }

  /** Add a listener to an event */
  addEventListener(
    type: ServerEventType,
    listener: EventListener<ServerEvent>,
    options?: EventOptions,
  ) {
    this.events.addEventListener(type, listener, options);
    return this;
  }

  /** Dispatch an event */
  dispatchEvent(event: ServerEvent) {
    return this.events.dispatchEvent(event);
  }

  /** Start the server in waiting mode */
  wait() {
    this.#waiting = true;
    this.start();
  }

  /** Start the server */
  start(signal?: AbortSignal) {
    if (!this.#server) {
      this.#server = serve({
        ...this.options,
        handler: this.handle.bind(this),
        signal,
        onListen: () => {
          if (!this.#waiting) {
            this.dispatchEvent({ type: "start" });
          }
        },
      });
    } else if (this.#waiting) {
      this.#waiting = false;
      this.dispatchEvent({ type: "start" });
    }
  }

  /** Stops the server */
  stop() {
    try {
      this.#server?.shutdown();
    } catch (err) {
      this.dispatchEvent({
        type: "error",
        error: err as Error,
      });
    }
  }

  /** Handle a http request event */
  async handle(
    request: Request,
    info: HandlerInfo,
  ): Promise<Response> {
    if (this.#waiting) {
      return this.handleWait();
    }

    const middlewares = [...this.middlewares];

    const next: RequestHandler = async (
      request: Request,
    ): Promise<Response> => {
      const middleware = middlewares.shift();

      if (middleware) {
        return await middleware(request, next, info);
      }

      return await this.options.serveFile(this.options.root, request);
    };

    return await next(request);
  }

  handleWait(url?: string): Response {
    return new Response(
      `<html>
      <head>
        <meta charset="utf-8">
        <title>Por favor, agarde - Please wait</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
        body {
          font-family: system-ui, sans-serif;
          margin: 0;
          padding: 2rem;
          box-sizing: border-box;
          display: grid;
          grid-template-columns: minmax(0, 800px);
          align-content: center;
          justify-content: center;
          min-height: 100vh
        }
        </style>
      </head>
      <body>
      <pre><samp>Por favor, agarde - Please wait\n</samp></pre>
      <script type="module">
        const samp = document.querySelector("samp");
        const timeout = 1000;
        while (true) {
          try {
            const url = ${url ? `"${url}"` : "document.location"};
            const response = await fetch(url);
            if (response.headers.get("X-Lume-CMS") !== "wait") {
              document.location = url;
              break;
            }
          } catch {}

          samp.textContent += ".";
          await new Promise((resolve) => setTimeout(resolve, timeout));
        }
      </script>
      </body>
      </html>`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
          "X-Lume-CMS": "wait",
        },
      },
    );
  }
}

/** Serve a static file */
export async function serveFile(
  root: string,
  request: Request,
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = posix.normalize(decodeURIComponentSafe(url.pathname));
  const path = posix.join(root, pathname);

  try {
    const file = path.endsWith("/") ? path + "index.html" : path;

    // Redirect /example to /example/
    const info = await stat(file);

    if (info.isDirectory) {
      const search = url.search;
      return new Response(null, {
        status: 301,
        headers: {
          location: posix.join(pathname, "/") + search,
        },
      });
    }

    // Serve the static file
    return await httpServeFile(request, file, info);
  } catch {
    try {
      // Exists a HTML file with this name?
      if (!posix.extname(path)) {
        return await httpServeFile(request, path + ".html");
      }
    } catch {
      // Continue
    }

    return new Response(
      "Not found",
      { status: 404 },
    );
  }
}
