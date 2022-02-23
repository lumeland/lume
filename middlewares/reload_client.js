let ws;
let wasClosed = false;

function socket() {
  if (ws && ws.readyState !== 3) {
    return;
  }

  ws = new WebSocket("ws://" + document.location.host);
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
  let path = document.location.pathname;

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
    const url = new URL(file, document.location.href);
    const format = url.pathname.split(".").pop().toLowerCase();

    switch (format) {
      case "css":
        {
          for (const style of Array.from(document.styleSheets)) {
            if (style.href) {
              const src = new URL(style.href);
              src.searchParams.delete("_cache");

              if (src.href === url.href) {
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
            const src = new URL(image.src);
            src.searchParams.delete("_cache");

            if (src.href === url.href) {
              reloadSource(image);
              continue;
            }
          }
        }
        break;

      // Reload the entire page for JavaScript changes

      case "js":
        location.reload();
        return;
    }
  }
}

function styleIsImported(url, style) {
  if (style.href === url.href) {
    return true;
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
