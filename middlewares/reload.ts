import { encodeBase64 } from "../deps/base64.ts";

import { normalizePath } from "../core/utils/path.ts";
import reloadClient from "./reload_client.js";

import type { Middleware } from "../core/server.ts";
import type { Watcher } from "../core/watcher.ts";
import type DebugBar from "../core/debugbar.ts";

export interface Options {
  /** The watcher instance to use */
  watcher: Watcher;
  /** The base path of the site. It's required by the reload script */
  basepath: string;
  /** The debug bar instance to use */
  debugBar?: DebugBar;
}

/** Middleware to hot reload changes */
export function reload(options: Options): Middleware {
  const sockets = new Set<WebSocket>();
  const { watcher, debugBar } = options;

  // Keep track of the change revision. A watch change
  // can be dispatched in-between the browser loading
  // the HTML and before it has established a WebSocket
  // connection. In this case the browser is out of sync
  // and shows an old version of the page. Upon establishing
  // a websocket connection we send the latest revision
  // and the browser can potentially refresh itself when
  // it has an older revision. The initial revision is
  // sent to the browser as part of the HTML.
  let revision = 0;
  let lastAcknowledgedRevision = 0;

  watcher.addEventListener("change", (event) => {
    revision++;

    if (!sockets.size) {
      return;
    }

    lastAcknowledgedRevision = revision;

    const files = event.files!;
    const message = JSON.stringify({
      type: "update",
      revision,
      files: Array.from(files).map((file) => normalizePath(file)),
      data: debugBar,
    });

    sockets.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    });

    console.log("Changes sent to the browser");
  });

  watcher.start();

  return async (request, next) => {
    // Is a websocket
    if (request.headers.get("upgrade") === "websocket") {
      const { socket, response } = Deno.upgradeWebSocket(request);

      socket.onopen = () => {
        // Browser was in the process of being reloaded. Notify
        // the user that the latest changes were sent.
        if (lastAcknowledgedRevision < revision) {
          lastAcknowledgedRevision = revision;
          console.log("Changes sent to the browser");
        }

        // Tell the browser about the most recent revision
        socket.send(JSON.stringify({ type: "init", revision, data: debugBar }));

        sockets.add(socket);
      };
      socket.onclose = () => sockets.delete(socket);
      socket.onerror = (e) => console.log("Socket errored", e);
      socket.onmessage = (e) => {
        if (options.debugBar && e.data) {
          const message = JSON.parse(e.data);
          const { data } = message;
          const { type } = data;
          options.debugBar.dispatchEvent({ type, data });
        }
      };

      return response;
    }

    // It's a regular request
    const response = await next(request);

    if (!response.body) {
      return response;
    }

    // Insert live-reload script in the body
    if (response.headers.get("content-type")?.includes("html")) {
      const reader = response.body.getReader();

      let body = "";
      let result = await reader.read();
      const decoder = new TextDecoder();

      while (!result.done) {
        body += decoder.decode(result.value);
        result = await reader.read();
      }

      let source = `${reloadClient};
      liveReload(${revision}, "${options.basepath}", ${response.status}, "${
        debugBar?.url || ""
      }");
      /*# sourceURL=inline:lume-live-reload.js */; `;

      if (request.url.endsWith(".xhtml")) {
        source = `//<![CDATA[\n${source}\n//]]>`;
      }
      const integrity = await computeSourceIntegrity(source);

      // Add live reload script and pass initial revision
      const code =
        `<script type="module" id="lume-live-reload" integrity="${integrity}">${source}</script>`;
      if (body.includes("</body>")) {
        body = body.replace("</body>", `${code}</body>`);
      } else {
        body += code;
      }

      const { status, statusText, headers } = response;

      return new Response(body, { status, statusText, headers });
    }

    return response;
  };
}

async function computeSourceIntegrity(source: string) {
  const bytes = new TextEncoder().encode(source);
  const hash = await crypto.subtle.digest("SHA-384", bytes);
  return `sha384-${encodeBase64(hash)}`;
}

export default reload;
