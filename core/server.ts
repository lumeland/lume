import Events from "./events.ts";
import { serveFile } from "./utils/serve_file.ts";
import { cwd } from "../services/process.ts";
import { merge } from "./utils/object.ts";
import { serve } from "../services/net.ts";

import type { Event, EventListener, EventOptions } from "./events.ts";
import type {
  HTTPHandlerInfo,
  HTTPServer,
  NetAddress,
} from "../services/net.ts";

import type { Merge } from "./utils/object.ts";

/** The options to configure the local server */
export interface Options {
  /** The root path */
  root?: string;
  port?: number;
  hostname?: string;
  signal?: AbortSignal;
  serveFile?: (root: string, request: Request) => Promise<Response>;
}

export const defaults = {
  root: `${cwd()}/_site`,
  port: 8000,
  serveFile,
} satisfies Options;

export type RequestHandler = (req: Request) => Promise<Response>;
export type Middleware = (
  req: Request,
  next: RequestHandler,
  info: HTTPHandlerInfo,
) => Promise<Response>;

export default class Server {
  // deno-lint-ignore no-explicit-any
  events: Events<any> = new Events<ServerEvent>();
  options: Merge<Options, typeof defaults>;
  middlewares: Middleware[] = [];
  fetch: (request: Request, info: HTTPHandlerInfo) => Promise<Response>;
  #server?: HTTPServer;
  #waiting = false;

  constructor(options?: Options) {
    this.options = merge(defaults, options);

    if (this.options.hostname === "localhost") {
      this.options.hostname = "0.0.0.0";
    }

    // Create the fetch function for `deno serve`
    this.fetch = (request: Request, info: HTTPHandlerInfo) => {
      return this.handle(request, info);
    };
  }

  /** The local address this server is listening on. */
  get addr(): NetAddress | undefined {
    return this.#server?.addr;
  }

  /** The port this server is listening on */
  get port(): number {
    return this.options.port;
  }

  /** The hostname this server is listening on */
  get hostname(): string {
    const { hostname } = this.options;

    return (hostname === "0.0.0.0" || hostname === "127.0.0.1")
      ? "localhost"
      : hostname ?? "localhost";
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
  addEventListener<K extends ServerEventType>(
    type: K,
    listener: EventListener<Event & ServerEvent<K>>,
    options?: EventOptions,
  ): this {
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
        onOpenSocket: (socket) => {
          this.dispatchEvent({ type: "openSocket", socket });
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
    info: HTTPHandlerInfo,
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

export type ServerEventMap = {
  // deno-lint-ignore ban-types
  start: {};
  openSocket: {
    socket: WebSocket;
  };
  error: {
    error: Error;
  };
};

/** Custom events for site build */
export type ServerEvent<T extends ServerEventType = ServerEventType> =
  & Event
  & ServerEventMap[T]
  & { type: T };

/** The available event types */
export type ServerEventType = keyof ServerEventMap;
