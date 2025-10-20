import { posix } from "../deps/path.ts";
import Events from "./events.ts";
import { serveFile as httpServeFile } from "../deps/http.ts";

import type { Event, EventListener, EventOptions } from "./events.ts";
import { decodeURIComponentSafe } from "./utils/path.ts";
import { merge } from "./utils/object.ts";

/** The options to configure the local server */
export interface Options extends Deno.ServeOptions {
  /** The root path */
  root: string;
  port?: number;
  hostname?: string;
  serveFile?: (root: string, request: Request) => Promise<Response>;
}

export const defaults: Options = {
  root: `${Deno.cwd()}/_site`,
  port: 8000,
  serveFile,
};

export type RequestHandler = (req: Request) => Promise<Response>;
export type Middleware = (
  req: Request,
  next: RequestHandler,
  info: Deno.ServeHandlerInfo,
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
  #server?: Deno.HttpServer;
  fetch: Deno.ServeHandler;

  constructor(options: Partial<Options> = {}) {
    this.options = merge(defaults, options);

    if (this.options.hostname === "localhost") {
      this.options.hostname = "0.0.0.0";
    }

    // Create the fetch function for `deno serve`
    this.fetch = (request: Request, info: Deno.ServeHandlerInfo) => {
      return this.handle(request, info);
    };
  }

  /** The local address this server is listening on. */
  get addr(): Deno.Addr | undefined {
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

  /** Start the server */
  start(signal?: Deno.ServeOptions["signal"]) {
    this.#server = Deno.serve({
      ...this.options,
      signal,
      onListen: () => this.dispatchEvent({ type: "start" }),
    }, this.handle.bind(this));
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
    info: Deno.ServeHandlerInfo,
  ): Promise<Response> {
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
    const info = await Deno.stat(file);

    if (info.isDirectory) {
      return new Response(null, {
        status: 301,
        headers: {
          location: posix.join(pathname, "/"),
        },
      });
    }

    // Serve the static file
    return await fixServeFile(request, file, info);
  } catch {
    try {
      // Exists a HTML file with this name?
      if (!posix.extname(path)) {
        return await fixServeFile(request, path + ".html");
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

async function fixServeFile(
  request: Request,
  path: string,
  fileInfo?: Deno.FileInfo,
): Promise<Response> {
  const response = await httpServeFile(request, path, { fileInfo });

  // Fix for https://github.com/lumeland/lume/issues/734
  if (response.headers.get("content-type") === "application/rss+xml") {
    response.headers.set("content-type", "application/xml");
  }

  return response;
}
