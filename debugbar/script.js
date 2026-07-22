import dom from "https://cdn.jsdelivr.net/gh/oscarotero/dom@0.2.1/dom.js";

const styles = await (await fetch(import.meta.resolve("./style.css"))).text();
const css = new CSSStyleSheet();
css.replaceSync(styles);

// Default colors for different contexts
const colors = new Map([
  ["error", "var(--db-color-error)"],
  ["warning", "var(--db-color-warning)"],
  ["success", "var(--db-color-success)"],
  ["info", "var(--db-color-info)"],
  ["important", "var(--db-color-important)"],
]);

/**
 * Class to manage the state of the LumeBar component.
 * It uses sessionStorage to persist the state across page reloads.
 */
class State {
  key = "lume-bar";

  constructor() {
    const restore = sessionStorage.getItem(this.key);
    this.state = restore ? JSON.parse(restore) : {};
    this.state.open = localStorage.getItem(this.key) === "open";
  }

  set(key, value) {
    this.state[key] = value;
    this.save();
  }

  get(key) {
    return this.state[key];
  }

  remove(key) {
    delete this.state[key];
    this.save();
  }

  save() {
    sessionStorage.setItem(this.key, JSON.stringify(this.state));
    localStorage.setItem(this.key, this.state.open ? "open" : "closed");
  }
}

/**
 * Class to create a bar component.
 * It fetches data from a JSON file and displays it in a structured format.
 */
export default class Bar extends HTMLElement {
  #trackingMouse;

  constructor() {
    super();
    this.state = new State();

    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <div class="bar">
        <div class="menu"><div class="tabs"></div><div class="actions"></div><div class="controls"></div></div>
        <div hidden class="details"></div>
      </div>
    `;
    this.shadowRoot.adoptedStyleSheets.push(css);

    this.bar = this.shadowRoot.querySelector(".bar");
    this.menu = this.bar.querySelector(".menu");
    this.actions = this.menu.querySelector(".actions");
    this.controls = this.menu.querySelector(".controls");
    this.tabs = this.menu.querySelector(".tabs");
    this.details = this.bar.querySelector(".details");
    this.collections = [];

    const icon = dom("lume-icon", {
      name: this.state.get("open") ? "x" : "lume",
    });
    const toggle = dom("button", {
      html: icon,
      title: "Toggle the Lume bar",
      onclick: () => {
        if (this.state.get("open")) {
          toggle.setAttribute("title", "Show the Lume bar");
          icon.setAttribute("name", "lume");
          this.classList.add("is-animated");
          this.close();
        } else {
          toggle.setAttribute(
            "title",
            "Close the Lume bar (hover at the bottom edge of the window to reveal it)",
          );
          icon.setAttribute("name", "x");
          this.classList.remove("is-animated");
          this.open();
        }
      },
    }, this.controls);
  }

  connectedCallback() {
    if (!this.state.get("open")) {
      this.close();
    } else {
      this.open();
    }

    // Ensure the bar is always on top of other elements
    this.setAttribute("popover", "manual");
    this.showPopover();
  }

  async update(data) {
    this.collections = [];
    this.tabs.innerHTML = "";
    this.details.innerHTML = "";
    this.actions.innerHTML = "";

    for (const action of data.actions ?? []) {
      this.actions.appendChild(this.renderAction(action))
    }

    for (const collection of data.collections ?? []) {
      if (collection.items) {
        await setIds(collection.items, []);
      }
      this.addCollection(collection);
    }
  }

  close() {
    this.state.set("open", false);
    this.classList.add("is-closed");

    let timeout;
    this.#trackingMouse = new AbortController();
    document.addEventListener("mousemove", (ev) => {
      if (ev.clientY > innerHeight - 80) {
        this.classList.add("is-hovered");
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.classList.remove("is-hovered");
        }, 500);
      }
    }, { signal: this.#trackingMouse.signal });
  }

  open() {
    this.#trackingMouse?.abort();
    this.state.set("open", true);
    this.classList.remove("is-closed");

    // Open the first tab if no active collection is set
    const pressedTab = this.tabs.querySelector("button[aria-pressed='true']");
    if (!pressedTab) {
      this.tabs.querySelector("button")?.click();
    }
  }

  addCollection(collection) {
    this.collections.push(collection);

    const button = dom("button", {
      data: {
        collection: collection.name,
      },
      html: [
        collection.icon ? dom("lume-icon", { name: collection.icon }) : "",
        collection.name,
        collection.items?.length
          ? ` <span class="badge">${collection.items.length}</span>`
          : "",
      ],
    });

    const onclick = () => {
      const pressed = button.getAttribute("aria-pressed") === "true";

      if (pressed) {
        button.removeAttribute("aria-pressed");
        this.details.innerHTML = "";
        this.details.hidden = true;
        this.state.remove("active_collection");
      } else {
        this.menu.querySelectorAll("button").forEach((btn) =>
          button !== btn && btn.removeAttribute("aria-pressed")
        );
        button.setAttribute("aria-pressed", "true");
        this.details.innerHTML = "";
        this.details.hidden = false;
        collection.items?.length
          ? dom("ul", {
            class: "collection",
            html: collection.items.map((item) =>
              this.renderItem(collection, item)
            ),
          }, this.details)
          : dom("p", {
            class: "collection-empty",
            html: collection.empty || "No items found",
          }, this.details);

        this.state.set("active_collection", collection.name);
      }
    };

    button.addEventListener("click", () => {
      this.state.remove("current_item");
      onclick();
    });

    this.tabs.appendChild(button);

    if (this.state.get("active_collection") === collection.name) {
      onclick();
      const currentItem = this.state.get("current_item");

      if (currentItem) {
        const [itemId, isOpen] = currentItem;

        const target = this.details.querySelector(`#${itemId}`);

        if (target) {
          let item = target?.closest("details");
          const items = [];

          while (item) {
            items.push(item);
            item = item.parentElement.closest("details");
          }

          items.reverse().forEach((item) => item.open = true);

          if (target.firstElementChild?.tagName === "DETAILS") {
            target.firstElementChild.open = isOpen;
          }

          target.scrollIntoView();
        }
      }
    }
  }

  renderItem(collection, item) {
    const { contexts } = collection;

    const li = dom("li", {
      class: "item",
      id: item.id,
      "--db-color-context": item.context
        ? getColor(contexts?.[item.context]?.background, "var(--db-color-dim)")
        : undefined,
    });

    if (item.text || item.code || item.items?.length) {
      dom("details", {
        ontoggle: (ev) => {
          if (item.id) {
            this.state.set("current_item", [item.id, ev.target.open]);
          } else {
            this.state.remove("current_item");
          }
        },
        html: [
          dom("summary", {
            class: "item-title",
            html: [
              this.renderContext(item, contexts),
              dom("div", {
                class: "item-title-content",
                html: extractBadge(item.title, item.icon),
              }),
              item.items?.length
                ? ` <span class="badge">${item.items.length}</span>`
                : "",
              item.details
                ? dom("span", {
                  class: "item-details",
                  html: item.details,
                })
                : "",
            ],
          }),
          item.text
            ? dom("div", {
              class: "item-text",
              html: item.text,
            })
            : "",
          item.code
            ? dom("pre", {
              class: "item-code",
              html: item.code,
            })
            : "",
          item.items?.length
            ? dom("ul", {
              class: "collection",
              html: item.items.map((item) => this.renderItem(collection, item)),
            })
            : "",
        ],
      }, li);
    } else {
      dom("div", {
        class: "item-title",
        html: [
          this.renderContext(item, contexts),
          dom("p", {
            class: "item-title-content",
            html: extractBadge(item.title, item.icon),
          }),
          item.details
            ? dom("span", {
              class: "item-details",
              html: item.details,
            })
            : "",
        ],
      }, li);
    }

    if (item.actions) {
      const actions = dom("div", {
        class: "item-actions",
        html: item.actions.map((action) => this.renderAction(action, item)),
      });

      li.appendChild(actions);
    }

    return li;
  }

  renderContext(item, contexts) {
    if (!item.context) {
      return "";
    }

    const context = contexts?.[item.context];
    if (!context) {
      console.error(`Context not found: ${item.context}`);
      return "";
    }

    const { color, background } = context;

    return dom("span", {
      class: "badge",
      "--db-background": background
        ? colors.get(background) ?? background
        : "var(--db-color-dim)",
      "--db-color": getColor(color, "var(--db-color-background)"),
      html: [
        context.icon ? dom("lume-icon", { name: context.icon }) : "",
        context.title ?? item.context,
      ],
    });
  }

  renderAction(action, item) {
    const button = dom((action.href) ? "a" : "button", {
      class: "item-action",
      html: [
        action.icon ? dom("lume-icon", { name: action.icon }) : "",
        action.text,
      ],
      data: action.data,
      href: action.href,
      target: action.target,
      onclick: action.data && !action.onclick
        ? (ev) => {
          ev.preventDefault();
          if (
            this.websocket && button.getAttribute("aria-pressed") !== "true"
          ) {
            this.websocket.send(JSON.stringify({
              item,
              data: button.dataset,
            }));
            if (item) {
              this.state.set("current_item", [item.id, true]);
            }
            button.appendChild(dom("span", { class: "loader" }));
            button.setAttribute("aria-pressed", "true");
          }
        }
        : action.onclick,
    });

    return button;
  }
}

customElements.define("lume-bar", Bar);

/**
 * Custom element to display an icon.
 * It fetches the icon from a CDN and caches it for future use.
 */
class Icon extends HTMLElement {
  // Cache for icons to avoid fetching them multiple times
  static cache = new Map();
  static lume = `
  <svg width="204" height="204" viewBox="0 0 204 204" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M109.101 78.5092C94.3635 64.9692 81.938 53.5531 88.4027 27.2952C60.4821 61.9286 59.3798 73.4094 70.9216 102.953C78.555 122.515 68.0654 137.935 57.754 153.094C52.4869 160.838 47.2663 168.512 44.5314 176.636C30.8216 160.139 27.9976 144.342 30.8216 115.936C25.4552 132.474 17.7529 144.245 10.3272 155.594C10.1898 155.804 10.0525 156.014 9.91525 156.224L7.9476 159.228L6.01638 162.233C3.92324 165.524 1.89646 168.851 0 172.318V204H204V117.299C193.619 102.125 184.654 85.3552 184.654 58.6146C164.214 77.2349 161.12 96.4956 158.242 114.414C156.018 128.254 153.923 141.294 144.062 152.618C144.062 110.63 125.202 93.3021 109.101 78.5092Z"/>
    <path d="M90.0789 0V0.0182087C90.085 0.0255289 90.0912 0.0328444 90.0974 0.0401554C96.8483 14.6686 97.1207 24.0354 97.3552 32.1004C97.7228 44.7449 97.9974 54.1894 123.001 75.6946C119.59 64.5616 120.297 57.8549 120.947 51.6871C121.623 45.27 122.239 39.4363 118.091 29.808C113.247 18.5601 108.662 15.3807 103.113 11.5325C99.3461 8.92056 95.1351 6.00049 90.0974 0.0401554C90.0912 0.0267747 90.0851 0.0133896 90.0789 0Z"/>
    <path d="M58.8515 102.198C50.325 82.8507 48.7126 60.8179 56.1277 53.2612C37.5261 63.5583 23.4975 87.8308 33.7366 106.167C43.9848 124.504 46.1711 130.167 44.0759 154.002C44.7992 152.927 45.5196 151.865 46.2331 150.812C57.4069 134.329 66.8662 120.375 58.8515 102.198Z"/>
    <path d="M138.224 35.0982C135.582 32.9394 132.543 30.4559 129.049 27.4227C135.015 41.9862 133.894 52.3277 132.906 61.453C131.476 74.6505 130.321 85.3043 151.277 102.507C149.434 91.4006 151.127 84.2178 152.725 77.4388C154.042 71.848 155.295 66.5319 154.447 59.5159C152.933 47.1177 148.706 43.6636 138.224 35.0982Z"/>
  </svg>`;

  static get observedAttributes() {
    return ["name"];
  }

  async attributeChangedCallback(_name, _oldValue, newValue) {
    this.innerHTML = await this.fetch(newValue);
  }

  async fetch(name) {
    if (name === "lume") {
      return Icon.lume;
    }

    const variant = name.endsWith("-fill") ? "fill" : "regular";
    const url =
      `https://cdn.jsdelivr.net/npm/@phosphor-icons/core@2.1.1/assets/${variant}/${name}.svg`;

    if (Icon.cache.has(url)) {
      return Icon.cache.get(url);
    }

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Icon not found: ${name}`);
    }

    const text = response.ok ? await response.text() : "";

    Icon.cache.set(url, text);
    return text;
  }
}

customElements.define("lume-icon", Icon);

/** Get the color for a specific context or return a default color */
function getColor(color, defaultColor) {
  return color ? colors.get(color) ?? color : defaultColor;
}

/**
 * Set missing IDs for items in a collection.
 */
async function setIds(items, ids) {
  for (const item of items) {
    if (item.id) {
      ids.push(item.id);
    } else {
      ids.push(item.title);
      item.id = await generateId(ids);
    }

    if (item.items) {
      await setIds(item.items, [...ids]);
    }
  }
}

/**
 * Generate a unique ID based on the name using SHA-1 hashing.
 * The ID is prefixed with "id_" to ensure it starts with a letter.
 */
async function generateId(names) {
  const data = new TextEncoder().encode(names.join("/"));
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `id_${hashHex}`;
}

function extractBadge(text, icon) {
  if (!text.startsWith("[")) {
    return [
      icon ? `<lume-icon name="${icon}"></lume-icon> ` : "",
      text,
    ];
  }
  const match = text.match(/^\[([^\]]+)\]\s*(.*)$/);
  return match
    ? [
      `<span class="badge">${match[1]}</span> `,
      icon ? `<lume-icon name="${icon}"></lume-icon> ` : "",
      match[2],
    ]
    : ["", text];
}
