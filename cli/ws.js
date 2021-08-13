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

    if (!Array.isArray(files)) {
      console.log(e.data);
      return;
    }

    refresh(files);
  };
  ws.onerror = (err) => {
    console.error("WebSocket error observed:", err);
  };
}

setInterval(socket, 1000);

function refresh(files) {
  let path = document.location.pathname;

  if (!path.endsWith(".html")) {
    path += path.endsWith("/") ? "index.html" : "/index.html";
  }

  const index = files.indexOf(path);

  // Reload the entire page if the HTML changes
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

      case "apng":
      case "avif":
      case "gif":
      case "jpeg":
      case "jpg":
      case "png":
      case "svg":
      case "webp":
        document.querySelectorAll("img").forEach((el) =>
          cache(el, "src", file)
        );
        break;

      // Reload the entire page for JavaScript changes

      case "js":
        location.reload();
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

  url.searchParams.set("_cache", Date.now());

  if (clone) {
    const newEl = el.cloneNode();
    newEl[prop] = url.href;
    el.after(newEl);
    setTimeout(() => el.remove(), 500);
    return;
  }

  el[prop] = url.href;
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
