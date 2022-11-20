export default function liveReload() {
  let ws;
  let wasClosed = false;

  function socket() {
    if (ws && ws.readyState !== 3) {
      return;
    }
    const protocol = document.location.protocol === "https:" ? "wss://" : "ws://";
    ws = new WebSocket(protocol + document.location.host);
    ws.onopen = () => {
      console.log("Lume live reloading is ready. Listening for changes...");

      // Reload after reconnect
      if (wasClosed) {
        location.reload();
        return;
      }

      const files = read();

      if (files) {
        refresh(files);
      }
    };
    ws.onmessage = (e) => {
      const files = JSON.parse(e.data);

      if (!Array.isArray(files)) {
        console.log(e.data);
        return;
      }

      refresh(files);
    };
    ws.onclose = () => {
      wasClosed = true;
      // Socket connection closed. Will attempt to reconnect in 5 seconds.
      setTimeout(socket, 5000);
    };
    ws.onerror = (err) => console.error("Lume webSocket error observed:", err);
  }
  addEventListener("pagehide", () => {
    if (ws) {
      ws.close();
    }
  });

  socket();

  function refresh(files) {
    let path = decodeURI(document.location.pathname);

    if (!path.endsWith(".html")) {
      path += path.endsWith("/") ? "index.html" : "/index.html";
    }

    const index = files.indexOf(path);

    // Reload the entire page if the HTML changes
    if (index !== -1) {
      files.splice(index, 1);
      save(files);
      location.reload();
      return;
    }

    for (const file of files) {
      const url = createUrl(file);
      const format = url.pathname.split(".").pop().toLowerCase();

      switch (format) {
        case "css":
          {
            for (const style of Array.from(document.styleSheets)) {
              if (style.href) {
                if (isSame(url, style.href)) {
                  reloadStylesheet(style.ownerNode);
                  continue;
                }
              }

              // The file is @import'ed in a stylesheet
              if (styleIsImported(url, style)) {
                location.reload();
                break;
              }
            }
          }
          break;

        case "apng":
        case "avif":
        case "gif":
        case "jpeg":
        case "jpg":
        case "png":
        case "svg":
        case "webp":
          {
            for (const image of Array.from(document.images)) {
              if (isSame(url, image.src)) {
                reloadSource(image);
                continue;
              }
            }
          }
          break;

        case "js":
          // Reload the entire page for JavaScript changes
          location.reload();
          return;
      }
    }
  }

  function styleIsImported(url, style) {
    if (style.href === url.href) {
      return true;
    }

    if (style.origin !== url.origin) {
      return false;
    }

    for (let i = 0; i < style.cssRules.length; i++) {
      const rule = style.cssRules[i];

      if (!(rule instanceof CSSImportRule)) {
        continue;
      }

      if (!rule.styleSheet.href.startsWith(url.origin)) {
        continue;
      }

      if (styleIsImported(url, rule.styleSheet)) {
        return true;
      }
    }

    return false;
  }

  function reloadSource(element) {
    const src = new URL(element.src);
    src.searchParams.set("_cache", Date.now());
    element.src = src.href;
  }

  function reloadStylesheet(element) {
    const url = new URL(element.href);

    url.searchParams.set("_cache", Date.now());

    const newElement = element.cloneNode();
    newElement.href = url.href;
    element.after(newElement);
    setTimeout(() => element.remove(), 500);
  }

  function save(data) {
    sessionStorage.setItem("lume-reload", JSON.stringify(data));
  }

  function read() {
    const data = sessionStorage.getItem("lume-reload");
    sessionStorage.removeItem("lume-reload");

    if (data) {
      return JSON.parse(data);
    }
  }

  function createUrl(href) {
    // Remove search and hash
    const url = new URL(href, document.location.href);
    url.search = "";
    url.hash = "";

    return url;
  }

  function isSame(currentUrl, href) {
    const newUrl = createUrl(href);

    if (currentUrl.origin !== newUrl.origin) {
      return false;
    }

    // To handle cache busting urls (e.g. /v234/styles.css -> /styles.css)
    return newUrl.pathname.endsWith(currentUrl.pathname);
  }
}
