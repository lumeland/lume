import { listenAndServe } from "../deps/server.js";
import { acceptWebSocket } from "../deps/ws.js";
import { extname, join, relative } from "../deps/path.js";
import { brightGreen, red } from "../deps/colors.js";

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

export async function server(root) {
  console.log("");
  console.log("  Server started at:");
  console.log(brightGreen("  http://localhost:3000/"));
  console.log("");

  //Static files server
  listenAndServe({ port: 3000 }, async (req) => {
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
        headers: new Headers({ "content-type": mimeType }),
        body: await (mimeType === "text/html"
          ? getHtmlBody(path)
          : getBody(path)),
      });
    } catch (err) {
      console.log(`${red(req.method)} ${req.url}`);
      console.error(red(err.message));
    }
  });

  //Live reload server
  const watcher = Deno.watchFs(root);
  const changes = new Set();
  let latestSocket;

  listenAndServe({ port: 3001 }, async (req) => {
    const { conn, r: bufReader, w: bufWriter, headers } = req;
    const socket = await acceptWebSocket({
      conn,
      bufReader,
      bufWriter,
      headers,
    });

    latestSocket = socket;

    for await (const event of watcher) {
      if (event.kind === "modify") {
        event.paths.forEach((path) => changes.add(path));
      }
    }
  });

  return async () => {
    if (changes.size && latestSocket) {
      const files = Array.from(changes).map((path) =>
        join("/", relative(root, path))
      );
      await latestSocket.send(JSON.stringify(files));
      changes.clear();
    }
  };
}

async function getHtmlBody(path) {
  const content = await Deno.readTextFile(path);

  return `${content}
    <script>
      let ws;

      function socket() {
        if (ws && ws.readyState !== 3) {
          return;
        }

        ws = new WebSocket('ws://localhost:3001');
        ws.onopen = () => console.log('Socket connection open. Listening for events.');
        ws.onmessage = (e) => {
          const files = JSON.parse(e.data);

          if (!Array.isArray(files)) {
            console.log(e.data);
            return;
          }

          let path = document.location.pathname;
          if (!path.endsWith(".html")) {
            path += path.endsWith("/") ? "index.html" : "/index.html";
          }

          if (files.includes(path)) {
            location.reload();
            return;
          }

          files.forEach((file) => {
            const format = file.split(".").pop().toLowerCase();

            switch (format) {
              case "css":
                document.querySelectorAll('link[rel="stylesheet"]').forEach((el) => cache(el, 'href', file));
                break;

              case "jpeg":
              case "jpg":
              case "png":
              case "svg":
              case "gif":
                document.querySelectorAll('img').forEach((el) => cache(el, 'src', file));
                break;

              case "js":
                document.querySelectorAll('script').forEach((el) => cache(el, 'src', file));
                break;
            }
          })
        };
      }

      function cache(el, attr, file) {
        const url = new URL(el[attr]);
        if (url.pathname !== file) {
          return;
        }
        url.searchParams.set('_cache', (new Date()).getTime());
        el[attr] = url.toString();
      }

      setInterval(socket, 1000);
    </script>`;
}

async function getBody(path) {
  const file = await Deno.open(path);
  const content = await Deno.readAll(file);
  Deno.close(file.rid);

  return content;
}
