import { brightGreen, dim, red } from "../deps/colors.ts";
import localIp from "../deps/local_ip.ts";
import { mimes, normalizePath, serveFile } from "../core/utils.ts";
import { printError } from "../core/errors.ts";
import { runWatch } from "./utils.ts";

import type { ServerOptions } from "../core/site.ts";

// Websocket client code
const wsCode = await (await fetch(new URL("./ws.js", import.meta.url))).text();

/** Start a local HTTP server and live-reload the changes */
export default async function server(
  root: string,
  options?: ServerOptions,
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
  const sockets: WebSocket[] = [];

  runWatch({
    root,
    fn: (files: Set<string>) => {
      if (!sockets.length) {
        return;
      }
      const urls = Array.from(files).map((file) => normalizePath(file));
      const message = JSON.stringify(urls);
      sockets.forEach((socket) => socket.send(message));
      console.log("Changes sent to the browser");
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
    const url = new URL(request.url);

    try {
      let [body, data] = await serveFile(url, {
        root,
        directoryIndex: true,
        page404,
        router: options?.router,
      });

      data.headers = new Headers(data.headers);

      // Insert live-reload script
      if (data.headers.get("content-type") === mimes.get(".html")) {
        if (body instanceof Uint8Array) {
          body = new TextDecoder().decode(body);
        }

        body = `${
          body ?? ""
        }<script type="module" id="lume-live-reload">${wsCode}</script>`;
      }

      // Add headers to prevent cache
      data.headers.set("cache-control", "no-cache no-store must-revalidate");
      const response = new Response(body, data);
      await event.respondWith(response);
      logResponse(response, url);
    } catch (cause) {
      const response = new Response(`Error: ${cause.toString()}`, {
        status: 500,
      });
      try {
        await event.respondWith(response);
        logResponse(response, url, cause);
      } catch {
        // Ignore
      }
    }
  }

  function handleSocket(event: Deno.RequestEvent) {
    const { socket, response } = Deno.upgradeWebSocket(event.request);

    socket.onopen = () => sockets.push(socket);
    socket.onclose = () => {
      const index = sockets.indexOf(socket);

      if (index !== -1) {
        sockets.splice(index, 1);
      }
    };
    socket.onerror = (e) => console.log("Socket errored", e);

    event.respondWith(response);
  }
}

function logResponse(response: Response, url: URL, cause?: Error) {
  const { status } = response;
  const { pathname } = url;

  if (status === 404 || status === 500) {
    console.log(`${red(status.toString())} ${pathname}`);
  } else if (status === 200) {
    console.log(`${brightGreen(status.toString())} ${pathname}`);
  } else if (status === 301 || status === 302) {
    console.log(
      `${dim(status.toString())} ${pathname} => ${
        response.headers.get("location")
      }`,
    );
  } else {
    console.log(`${dim(status.toString())} ${pathname}`);
  }

  if (cause) {
    printError(cause);
  }
}
