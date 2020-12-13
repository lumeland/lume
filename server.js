import { listenAndServe } from "./deps/server.js";
import { acceptWebSocket } from "./deps/ws.js";
import { dirname, extname, join, relative } from "./deps/path.js";
import { brightGreen, red } from "./deps/colors.js";
import { exists } from "./deps/fs.js";

const script = `
let ws;

function socket() {
  if (ws && ws.readyState !== 3) {
    return;
  }

  ws = new WebSocket("ws://" + document.location.host);
  ws.onopen = () => {
    console.log("Socket connection open. Listening for events.");
    const files = read("refresh");

    if (files) {
      refresh(files);
    }
  };
  ws.onmessage = (e) => {
    const files = JSON.parse(e.data);
    console.log(files);

    if (!Array.isArray(files)) {
      console.log(e.data);
      return;
    }

    refresh(files);
  };
}

setInterval(socket, 1000);

function refresh(files) {
  let path = document.location.pathname;

  if (!path.endsWith(".html")) {
    path += path.endsWith("/") ? "index.html" : "/index.html";
  }

  const index = files.indexOf(path);

  if (index !== -1) {
    files.splice(index, 1);
    save("refresh", files);
    location.reload();
    return;
  }

  files.forEach((file) => {
    const format = file.split(".").pop().toLowerCase();

    switch (format) {
      case "css":
        document.querySelectorAll('link[rel="stylesheet"]').forEach((el) =>
          cache(el, "href", file, true)
        );
        break;

      case "jpeg":
      case "jpg":
      case "png":
      case "svg":
      case "gif":
        document.querySelectorAll("img").forEach((el) =>
          cache(el, "src", file)
        );
        break;

      case "js":
        document.querySelectorAll("script").forEach((el) =>
          cache(el, "src", file)
        );
        break;
    }
  });
}

function cache(el, attr, file, clone = false) {
  const url = new URL(el[attr]);

  if (url.pathname !== file) {
    return;
  }

  url.searchParams.set("_cache", (new Date()).getTime());

  if (clone) {
    const newEl = el.cloneNode();
    newEl[attr] = url.toString();
    el.after(newEl);
    setTimeout(() => el.remove(), 500);
    return;
  }

  el[attr] = url.toString();
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function read(key) {
  const data = localStorage.getItem(key);
  localStorage.removeItem(key);

  if (data) {
    return JSON.parse(data);
  }
}
`;

const mimes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
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

export async function server(site, options) {
  const root = site.dest();
  const port = parseInt(options.port) || site.options.server.port || 3000;
  const page404 = site.options.server.page404 || "/404.html";

  console.log("");
  console.log("  Server started at:");
  console.log(brightGreen(`  http://localhost:${port}/`));
  console.log("");

  //Live reload server
  const watcher = Deno.watchFs(root);

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
    let path = join(root, decodeURIComponent(req.url.split("?", 2).shift()));

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
      } catch (err) {
        return;
      }

      console.log(`${brightGreen("200")} ${req.url}`);
    } catch (err) {
      console.log(`${red("404")} ${req.url}`);
      await req.respond({
        status: 404,
        headers: new Headers({
          "content-type": mimes.get(".html"),
        }),
        body: await getNotFoundBody(root, page404, path),
      });
    }
  }

  async function handleSocket(req) {
    let timer = 0;
    const changes = new Set();
    const { conn, r: bufReader, w: bufWriter, headers } = req;
    const socket = await acceptWebSocket({
      conn,
      bufReader,
      bufWriter,
      headers,
    });

    function sendChanges() {
      const files = Array.from(changes).map((path) =>
        join("/", relative(root, path))
      );
      changes.clear();
      socket.send(JSON.stringify(files));
      console.log("Changes sent to browser");
    }

    console.log("Connected to browser");

    for await (const event of watcher) {
      if (event.kind === "modify") {
        event.paths.forEach((path) => changes.add(path));
      }

      //Debounce
      clearTimeout(timer);
      timer = setTimeout(sendChanges, 500);
    }
  }
}

async function getHtmlBody(path) {
  const content = await Deno.readTextFile(path);

  return `${content}<script>${script}</script>`;
}

async function getNotFoundBody(root, page404, file) {
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
    <p>The url <code>${relative(root, file)}</code> does not exist</p>
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

async function getBody(path) {
  const file = await Deno.open(path);
  const content = await Deno.readAll(file);
  Deno.close(file.rid);

  return content;
}

async function listDirectory(directory) {
  const files = [];

  if (!await exists(directory)) {
    return files;
  }

  for await (const info of Deno.readDir(directory)) {
    const name = info.name;
    const href = join(directory, name);

    files.push([name, href]);
  }

  return files;
}
