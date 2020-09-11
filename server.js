import { listenAndServe } from "./deps/server.js";
import { acceptWebSocket } from "./deps/ws.js";
import { extname, join, relative, dirname } from "./deps/path.js";
import { brightGreen, red } from "./deps/colors.js";

const script = await Deno.readTextFile(
  join(dirname(new URL(import.meta.url).pathname), "./server.ws.js"),
);

const mimes = new Map([
  [".html", "text/html"],
  [".js", "text/javascript"],
  [".css", "text/css"],
  [".json", "application/json"],
  [".ico", "image/x-icon"],
  [".png", "image/png"],
  [".jpg", "image/jpg"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
  [".mp3", "audio/mpeg"],
  [".mp4", "video/mpeg"],
  [".xml", "text/xml"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".wasm", "application/wasm"],
  [".webp", "image/webp"],
  [".webm", "video/webm"],
  [".zip", "application/zip"],
]);

export async function server(root, port) {
  console.log("");
  console.log("  Server started at:");
  console.log(brightGreen("  http://localhost:3000/"));
  console.log("");

  //Live reload server
  const watcher = Deno.watchFs(root);
  const changes = new Set();
  let socket;

  //Static files server
  listenAndServe({ port }, async (req) => {
    //Is websocket
    if (req.headers.get("upgrade") === "websocket") {
      handleSocket(req);
    } else {
      handleFile(req);
    }
  });

  async function handleFile(req) {
    let path = join(root, req.url.split("?", 2).shift());

    try {
      const info = await Deno.stat(path);

      if (info.isDirectory) {
        path = join(path, "index.html");
      }
    } catch (err) {
      console.log(`${red(req.method)} ${req.url}`);
      console.error(red(err.message));
      await req.respond({ status: 404 });
      return;
    }

    const mimeType = mimes.get(extname(path).toLowerCase()) ||
      "application/octet-stream";

    try {
      console.log(`${brightGreen(req.method)} ${req.url}`);
      await req.respond({
        status: 200,
        headers: new Headers({
          "content-type": mimeType,
          "cache-control": "no-cache no-store must-revalidate",
        }),
        body: await (mimeType === "text/html"
          ? getHtmlBody(path)
          : getBody(path)),
      });
    } catch (err) {
      console.log(`${red(req.method)} ${req.url}`);
      console.error(red(err.message));
    }
  }

  async function handleSocket(req) {
    const { conn, r: bufReader, w: bufWriter, headers } = req;
    socket = await acceptWebSocket({
      conn,
      bufReader,
      bufWriter,
      headers,
    });

    for await (const event of watcher) {
      if (event.kind === "modify") {
        event.paths.forEach((path) => changes.add(path));
      }
    }
  }

  return async () => {
    if (changes.size && socket) {
      const files = Array.from(changes).map((path) =>
        join("/", relative(root, path))
      );
      changes.clear();
      return socket.send(JSON.stringify(files));
    }
  };
}

async function getHtmlBody(path) {
  const content = await Deno.readTextFile(path);

  return `${content}<script>${script}</script>`;
}

async function getBody(path) {
  const file = await Deno.open(path);
  const content = await Deno.readAll(file);
  Deno.close(file.rid);

  return content;
}
