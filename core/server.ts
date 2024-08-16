/// <reference lib="deno.unstable" />
// Deno.Server.shutdown() is unstable

import { posix } from "../deps/path.ts";
import Events from "./events.ts";
import { serveFile as HttpServeFile } from "../deps/http.ts";

import type { Event, EventListener, EventOptions } from "./events.ts";
import { decodeURIComponentSafe } from "./utils/path.ts";

/** The options to configure the local server */
export interface Options extends Deno.ServeOptions {
  /** The root path */
  root: string;
}

export const defaults: Options = {
  root: `${Deno.cwd()}/_site`,
  port: 8000,
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
  options: Options;
  middlewares: Middleware[] = [];
  #server?: Deno.HttpServer;

  constructor(options: Partial<Options> = {}) {
    this.options = { ...defaults, ...options };
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
    } catch (error) {
      this.dispatchEvent({
        type: "error",
        error,
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

      return await serveFile(this.options.root, request);
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
  const pathname = decodeURIComponentSafe(url.pathname)
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
    return await HttpServeFile(request, file);
  } catch {
    try {
      // Exists a HTML file with this name?
      if (!posix.extname(path)) {
        return await HttpServeFile(request, path + ".html");
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
