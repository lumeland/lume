import { ServerOptions } from "../core.ts";
import { dirname, extname, join, posix, relative, SEP } from "../deps/path.ts";
import { brightGreen, red } from "../deps/colors.ts";
import { exists } from "../deps/fs.ts";
import localIp from "../deps/local_ip.ts";
import { mimes, normalizePath } from "../core/utils.ts";
import { readAll } from "../deps/util.ts";

/** Start a local HTTP server and live-reload the changes */
export default async function server(root: string, options?: ServerOptions) {
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
  const watcher = Deno.watchFs(root);

  let timer = 0;
  let currentSocket: WebSocket | undefined;
  const changes: Set<string> = new Set();

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

      const mimeType = mimes.get(extname(path).toLowerCase()) ||
        "application/octet-stream";

      try {
        const body = await (mimeType === "text/html; charset=utf-8"
          ? getHtmlBody(path)
          : getBody(path));

        await event.respondWith(
          new Response(body, {
            status: 200,
            headers: new Headers({
              "content-type": mimeType,
              "cache-control": "no-cache no-store must-revalidate",
            }),
          }),
        );
      } catch {
        return;
      }

      console.log(`${brightGreen("200")} ${request.url}`);
    } catch {
      console.log(`${red("404")} ${request.url}`);

      try {
        const body = await getNotFoundBody(root, page404, path);
        await event.respondWith(
          new Response(body, {
            status: 404,
            headers: new Headers({
              "content-type": mimes.get(".html")!,
            }),
          }),
        );
      } catch {
        return;
      }
    }
  }

  async function handleSocket(event: Deno.RequestEvent) {
    const { socket, response } = Deno.upgradeWebSocket(event.request);

    socket.onopen = () => {
      if (!currentSocket) {
        console.log("Live reload started");
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

    async function sendChanges() {
      if (!changes.size || !currentSocket) {
        return;
      }

      const files = Array.from(changes).map((path) =>
        posix.join("/", normalizePath(relative(root, path)))
      );

      changes.clear();

      try {
        console.log("Changed sent to the browser");
        await currentSocket.send(JSON.stringify(files));
      } catch (err) {
        console.log(
          `Changes couldn't be sent to browser due "${err.message.trim()}"`,
        );
      }
    }

    for await (const event of watcher) {
      if (event.kind !== "modify" && event.kind !== "create") {
        continue;
      }

      event.paths.forEach((path) => changes.add(path));

      // Debounce
      clearTimeout(timer);
      timer = setTimeout(sendChanges, 100);
    }
  }
}

let wsFile: URL | string = new URL("./ws.js", import.meta.url);

if (wsFile.protocol === "file:") {
  wsFile = await Deno.readTextFile(wsFile);
}

async function getHtmlBody(path: string) {
  const content = await Deno.readTextFile(path);

  return typeof wsFile === "string"
    ? `${content}<script type="module" id="lume-live-reload">${wsFile}</script>`
    : `${content}<script type="module" src="${wsFile}" id="lume-live-reload"></script>`;
}

async function getNotFoundBody(root: string, page404: string, file: string) {
  const filepath = join(root, page404);

  if (await exists(filepath)) {
    return getHtmlBody(filepath);
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
    content.map((item) =>
      `<li>
            <a href="${relative(root, item[1])}">
              ${item[0]}
            </a>
          </li>`
    ).join("\n")
  }
    </ul>
  </body>
</html>`;
}

async function getBody(path: string) {
  const file = await Deno.open(path);
  const content = await readAll(file);
  Deno.close(file.rid);

  return content;
}

async function listDirectory(directory: string) {
  const files: [string, string][] = [];

  if (!await exists(directory)) {
    return files;
  }

  for await (const info of Deno.readDir(directory)) {
    const name = info.name;
    const href = normalizePath(join(directory, name));

    files.push([name, href]);
  }

  return files;
}
