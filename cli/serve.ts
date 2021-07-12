import { Site } from "../types.ts";
import { listenAndServe, ServerRequest } from "../deps/server.ts";
import { acceptWebSocket, WebSocket } from "../deps/ws.ts";
import { dirname, extname, join, posix, relative } from "../deps/path.ts";
import { brightGreen, red } from "../deps/colors.ts";
import { exists } from "../deps/fs.ts";
import localIp from "../deps/local_ip.ts";
import { mimes, normalizePath } from "../utils.ts";
import { readAll } from "../deps/util.ts";

/**
 * Start a local HTTP server and live-reload the changes
 * @param site The Site instance
 */
export default async function server(site: Site) {
  const root = site.dest();
  const port = site.options.server.port || 3000;
  const ipAddr = await localIp();
  const page404 = site.options.server.page404 || "/404.html";

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

  if (site.options.server.open) {
    const commands = {
      darwin: "open",
      linux: "xdg-open",
      windows: "explorer",
    };

    Deno.run({ cmd: [commands[Deno.build.os], `http://localhost:${port}/`] });
  }

  // Live reload server
  const watcher = Deno.watchFs(root);

  // Static files server
  listenAndServe({ port }, (req: ServerRequest) => {
    // Is websocket
    if (req.headers.get("upgrade") === "websocket") {
      handleSocket(req);
    } else {
      handleFile(req);
    }
  });

  async function handleFile(req: ServerRequest) {
    let path = join(root, decodeURIComponent(req.url.split("?", 2).shift()!));

    try {
      const info = await Deno.stat(path);

      if (info.isDirectory) {
        path = join(path, "index.html");
        await Deno.stat(path);
      }

      const mimeType = mimes.get(extname(path).toLowerCase()) ||
        "application/octet-stream";

      try {
        await req.respond({
          status: 200,
          headers: new Headers({
            "content-type": mimeType,
            "cache-control": "no-cache no-store must-revalidate",
          }),
          body: await (mimeType === "text/html; charset=utf-8"
            ? getHtmlBody(path)
            : getBody(path)),
        });
      } catch {
        return;
      }

      console.log(`${brightGreen("200")} ${req.url}`);
    } catch {
      console.log(`${red("404")} ${req.url}`);

      try {
        await req.respond({
          status: 404,
          headers: new Headers({
            "content-type": mimes.get(".html")!,
          }),
          body: await getNotFoundBody(root, page404, path),
        });
      } catch {
        return;
      }
    }
  }

  let timer = 0;
  let socket: WebSocket;
  const changes: Set<string> = new Set();

  async function handleSocket(req: ServerRequest) {
    const { conn, r: bufReader, w: bufWriter, headers } = req;
    socket = await acceptWebSocket({
      conn,
      bufReader,
      bufWriter,
      headers,
    });

    async function sendChanges() {
      if (!changes.size) {
        return;
      }

      const files = Array.from(changes).map((path) =>
        posix.join("/", normalizePath(relative(root, path)))
      );

      changes.clear();

      try {
        await socket.send(JSON.stringify(files));
        console.log("Changes sent to browser");
      } catch (err) {
        console.log(
          `Changes couldn't be sent to browser due "${err.message.trim()}"`,
        );
      }
    }

    console.log("Connected to browser");

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
