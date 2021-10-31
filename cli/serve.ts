import { ServerOptions } from "../core.ts";
import { dirname, extname, join, relative, SEP } from "../deps/path.ts";
import { brightGreen, red } from "../deps/colors.ts";
import localIp from "../deps/local_ip.ts";
import { mimes, normalizePath, warn } from "../core/utils.ts";
import { runWatch } from "./utils.ts";

/** Start a local HTTP server and live-reload the changes */
export default async function server(
  root: string,
  options?: ServerOptions,
  notFound?: (url: URL) => Promise<[BodyInit, ResponseInit] | void>,
) {
  const port = options?.port || 3000;
  const ipAddr = await localIp();
  let page404 = options?.page404 || "/404.html";

  if (page404.endsWith("/")) {
    page404 += "index.html";
  }

  console.log();
  console.log("  Server started at:");
  console.log(brightGreen(`  http://localhost:${port}/`), "(local)");

  if (!ipAddr) {
    console.log(red("Warning") + " Unable to detect your local IP address");
    console.log(
      "If you're on an Ubuntu machine, try installing net-tools with 'apt install net-tools'",
    );
  } else {
    console.log(brightGreen(`  http://${ipAddr}:${port}/`), "(network)");
  }

  console.log();

  if (options?.open) {
    const commands = {
      darwin: "open",
      linux: "xdg-open",
      windows: "explorer",
    };

    Deno.run({ cmd: [commands[Deno.build.os], `http://localhost:${port}/`] });
  }

  // Live reload server
  let currentSocket: WebSocket | undefined;

  runWatch({
    root,
    fn: (files: Set<string>) => {
      if (!currentSocket) {
        return;
      }
      const urls = Array.from(files).map((file) => normalizePath(file));
      console.log("Changes sent to the browser");
      return currentSocket.send(JSON.stringify(urls));
    },
  });

  // Static files server
  const server = Deno.listen({ port });

  for await (const conn of server) {
    handleConnection(conn);
  }

  async function handleConnection(conn: Deno.Conn) {
    const httpConn = Deno.serveHttp(conn);

    for await (const requestEvent of httpConn) {
      // Is a websocket
      if (requestEvent.request.headers.get("upgrade") === "websocket") {
        handleSocket(requestEvent);
        continue;
      }

      handleFile(requestEvent);
    }
  }

  async function handleFile(event: Deno.RequestEvent) {
    const { request } = event;
    const { pathname } = new URL(request.url);
    let path = join(root, pathname);

    try {
      if (path.endsWith(SEP)) {
        path += "index.html";
      }

      // Redirect /example to /example/
      const info = await Deno.stat(path);

      if (info.isDirectory) {
        await event.respondWith(
          new Response(null, {
            status: 301,
            headers: new Headers({
              "location": join(pathname, "/"),
              "cache-control": "no-cache no-store must-revalidate",
            }),
          }),
        );
        return;
      }

      // Serve the static file
      try {
        const mimeType = mimes.get(extname(path).toLowerCase()) ||
          "application/octet-stream";
        const body = await Deno.readFile(path);
        const response = createResponse(body, {
          status: 200,
          headers: {
            "content-type": mimeType,
            "cache-control": "no-cache no-store must-revalidate",
          },
        });

        await event.respondWith(response);
      } catch {
        return;
      }

      console.log(`${brightGreen("200")} ${request.url}`);
    } catch {
      // Serve pages on demand
      if (notFound) {
        const result = await notFound(new URL(request.url));

        if (result) {
          const [body, options] = result;
          await event.respondWith(createResponse(body, options));
          console.log(`${brightGreen("200")} (on demand) ${request.url}`);
          return;
        }
      }

      // Not found page
      try {
        const body = await getNotFoundBody(root, page404, path);
        const response = createResponse(body, {
          status: 404,
          headers: {
            "content-type": mimes.get(".html")!,
          },
        });
        await event.respondWith(response);
        console.log(`${red("404")} ${request.url}`);
      } catch {
        warn("Unable to serve the Not Found page", {
          url: request.url,
          page404,
        });
        return;
      }
    }
  }

  function handleSocket(event: Deno.RequestEvent) {
    const { socket, response } = Deno.upgradeWebSocket(event.request);

    socket.onopen = () => {
      if (!currentSocket) {
        console.log("Live reload active");
      }
      currentSocket = socket;
    };
    socket.onclose = () => {
      if (socket === currentSocket) {
        currentSocket = undefined;
      }
    };
    socket.onerror = (e) => console.log("Socket errored", e);

    event.respondWith(response);
  }
}

let wsFile: URL | string = new URL("./ws.js", import.meta.url);

if (wsFile.protocol === "file:") {
  wsFile = await Deno.readTextFile(wsFile);
}

async function getNotFoundBody(root: string, page404: string, file: string) {
  const filepath = join(root, page404);

  try {
    return await Deno.readTextFile(filepath);
  } catch {
    // Ignored
  }

  const content = await listDirectory(dirname(file));

  return `
<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Not found</title>
    <style> body { font-family: sans-serif; max-width: 40em; margin: auto; padding: 2em; line-height: 1.5; }</style>
  </head>
  <body>
    <h1>404 - Not found</h1>
    <p>The URL <code>${relative(root, file)}</code> does not exist</p>
    <ul>
${
    content.map((item) => `
    <li>
      <a href="${item}">
        ${item}
      </a>
    </li>`).join("\n")
  }
    </ul>
  </body>
</html>`;
}

function createResponse(body: BodyInit, options: ResponseInit): Response {
  options.headers = new Headers(options.headers);

  // Insert live-reload script
  if (options.headers.get("content-type") === mimes.get(".html")) {
    if (body instanceof Uint8Array) {
      body = new TextDecoder().decode(body);
    }

    body = typeof wsFile === "string"
      ? `${body}<script type="module" id="lume-live-reload">${wsFile}</script>`
      : `${body}<script type="module" src="${wsFile}" id="lume-live-reload"></script>`;
  }

  return new Response(body, options);
}

async function listDirectory(directory: string) {
  const files: string[] = [];

  try {
    for await (const info of Deno.readDir(directory)) {
      files.push(info.isDirectory ? `${info.name}/` : info.name);
    }
  } catch {
    return files;
  }

  return files;
}
