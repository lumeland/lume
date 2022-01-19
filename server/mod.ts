import { join, SEP } from "../deps/path.ts";

/** The options to configure the local server */
export interface Options {
  /** The root path */
  root: string;

  /** The port to listen on */
  port: number;

  /** To open the server in a browser */
  open: boolean;

  /** The file to serve on 404 error */
  page404: string;
}

export type ServerResponse = {
  status: number;
  headers: Headers;
  statusText?: string;
  body?: BodyInit;
};
export type RequestHandler = (req: Request) => Promise<ServerResponse>;
export type Middleware = (
  req: Request,
  next: RequestHandler,
) => Promise<ServerResponse>;

export default class Server {
  options: Options;
  middlewares: Middleware[] = [];

  constructor(options: Options) {
    this.options = options;
  }

  use(...middleware: Middleware[]) {
    this.middlewares.push(...middleware);
    return this;
  }

  async start() {
    const { port } = this.options;

    // Static files server
    const server = Deno.listen({ port });

    for await (const conn of server) {
      const httpConn = Deno.serveHttp(conn);

      for await (const event of httpConn) {
        this.handle(event);
      }
    }
  }

  async handle(event: Deno.RequestEvent) {
    const { request } = event;
    const middlewares = [...this.middlewares];

    const next: RequestHandler = async (
      request: Request,
    ): Promise<ServerResponse> => {
      const middleware = middlewares.shift();

      if (middleware) {
        return await middleware(request, next);
      }

      return await this.serveFile(request);
    };

    try {
      const { body, headers, status, statusText } = await next(request);
      const response = new Response(body, { headers, status, statusText });
      event.respondWith(response);
    } catch {
      // Ignore
    }
  }

  async serveFile(request: Request): Promise<ServerResponse> {
    const url = new URL(request.url);
    const { pathname } = url;
    let path = join(this.options.root, pathname);

    try {
      if (path.endsWith(SEP)) {
        path += "index.html";
      }

      // Redirect /example to /example/
      const info = await Deno.stat(path);

      if (info.isDirectory) {
        return {
          status: 301,
          headers: new Headers({
            "location": join(pathname, "/"),
          }),
        };
      }

      // Serve the static file
      return {
        status: 200,
        headers: new Headers(),
        body: await Deno.readFile(path),
      };
    } catch {
      return {
        status: 404,
        headers: new Headers(),
        body: "Not found",
      };
    }
  }
}
