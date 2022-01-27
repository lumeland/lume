import { brightGreen } from "../deps/colors.ts";
import { join, SEP } from "../deps/path.ts";

/** The options to configure the local server */
export interface Options {
  /** The root path */
  root: string;

  /** The port to listen on */
  port: number;

  /** To open the server in a browser */
  open?: boolean;
}

export type RequestHandler = (req: Request) => Promise<Response>;
export type Middleware = (
  req: Request,
  next: RequestHandler,
) => Promise<Response>;

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
    const server = Deno.listen({ port });

    this.init();

    for await (const conn of server) {
      this.handleConnection(conn);
    }
  }

  #localIp(): string | undefined {
    for (const info of Deno.networkInterfaces()) {
      if (info.family !== "IPv4" || info.address.startsWith("127.")) {
        continue;
      }

      return info.address;
    }
  }

  init() {
    const ipAddr = this.#localIp();
    const { port } = this.options;

    console.log();
    console.log("  Server started at:");
    console.log(brightGreen(`  http://localhost:${port}/`), "(local)");

    if (ipAddr) {
      console.log(brightGreen(`  http://${ipAddr}:${port}/`), "(network)");
    }

    console.log();

    if (this.options.open) {
      const commands = {
        darwin: "open",
        linux: "xdg-open",
        windows: "explorer",
      };

      Deno.run({ cmd: [commands[Deno.build.os], `http://localhost:${port}/`] });
    }
  }

  async handleConnection(conn: Deno.Conn) {
    const httpConn = Deno.serveHttp(conn);

    for await (const event of httpConn) {
      this.handle(event);
    }
  }

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
    } catch {
      // Ignore
    }
  }

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
