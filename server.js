import { listenAndServe } from "./deps/server.js";
import { acceptWebSocket } from "./deps/ws.js";
import { dirname, extname, join, posix, relative } from "./deps/path.js";
import { brightGreen, red } from "./deps/colors.js";
import { exists } from "./deps/fs.js";
import localIp from "./deps/local-ip.js";
import { mimes, normalizePath } from "./utils.js";

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
  ws.onerror = (e) => {
    console.error("WebSocket error observed:", event);
  }
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
      case "apng":
      case "webp":
      case "avif":
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

function cache(el, prop, file, clone = false) {
  const value = el[prop];

  if (!value) {
    return;
  }

  const url = new URL(value);

  if (url.pathname !== file) {
    return;
  }

  url.searchParams.set("_cache", (new Date()).getTime());

  if (clone) {
    const newEl = el.cloneNode();
    newEl[prop] = url.toString();
    el.after(newEl);
    setTimeout(() => el.remove(), 500);
    return;
  }

  el[prop] = url.toString();
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

export async function server(site, options) {
  const root = site.dest();
  const port = parseInt(options.port) || site.options.server.port || 3000;
  const ipAddr = await localIp();
  const page404 = site.options.server.page404 || "/404.html";

  console.log("");
  console.log("  Server started at:");
  console.log(brightGreen(`  http://localhost:${port}/`), "(local)");
  console.log(brightGreen(`  http://${ipAddr}:${port}/`), "(network)");
  console.log("");

  if (options.open || site.options.server.open) {
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
  listenAndServe({ port }, (req) => {
    // Is websocket
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

      try {
        await req.respond({
          status: 404,
          headers: new Headers({
            "content-type": mimes.get(".html"),
          }),
          body: await getNotFoundBody(root, page404, path),
        });
      } catch (err) {
        return;
      }
    }
  }

  let timer = 0;
  let socket;
  const changes = new Set();

  async function handleSocket(req) {
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
      if (event.kind !== "modify") {
        continue;
      }

      event.paths.forEach((path) => changes.add(path));

      // Debounce
      clearTimeout(timer);
      timer = setTimeout(sendChanges, 100);
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
    const href = normalizePath(join(directory, name));

    files.push([name, href]);
  }

  return files;
}
