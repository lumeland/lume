import { join, SEP } from "../deps/path.ts";
import Events from "./events.ts";

import type { Event, EventListener, EventOptions } from "../core.ts";

/** The options to configure the local server */
export interface Options {
  /** The root path */
  root: string;

  /** The port to listen on */
  port: number;
}

export type RequestHandler = (req: Request) => Promise<Response>;
export type Middleware = (
  req: Request,
  next: RequestHandler,
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

  constructor(options: Options) {
    this.options = options;
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
  async start() {
    const { port } = this.options;
    const server = Deno.listen({ port });

    this.dispatchEvent({ type: "start" });

    for await (const conn of server) {
      this.handleConnection(conn);
    }
  }

  /** Handle a http connection */
  async handleConnection(conn: Deno.Conn) {
    const httpConn = Deno.serveHttp(conn);

    for await (const event of httpConn) {
      this.handle(event);
    }
  }

  /** Handle a http request event */
  async handle(event: Deno.RequestEvent) {
    const { request } = event;
    const middlewares = [...this.middlewares];

    const next: RequestHandler = async (
      request: Request,
    ): Promise<Response> => {
      const middleware = middlewares.shift();

      if (middleware) {
        return await middleware(request, next);
      }

      return await this.serveFile(request);
    };

    try {
      const response = await next(request);
      await event.respondWith(response);
    } catch (error) {
      this.dispatchEvent({ type: "error", request, error });
    }
  }

  /** Server a static file */
  async serveFile(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname);
    let path = join(this.options.root, pathname);

    try {
      if (path.endsWith(SEP)) {
        path += "index.html";
      }

      // Redirect /example to /example/
      const info = await Deno.stat(path);

      if (info.isDirectory) {
        return new Response(null, {
          status: 301,
          headers: {
            location: join(pathname, "/"),
          },
        });
      }

      // Serve the static file
      return new Response(
        await Deno.readFile(path),
        { status: 200 },
      );
    } catch {
      return new Response(
        "Not found",
        { status: 404 },
      );
    }
  }
}
