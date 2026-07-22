import dom from "https://cdn.jsdelivr.net/gh/oscarotero/dom@0.2.1/dom.js";

const styles = `
:host {
  --db-color-base: hsl(220, 20%, 100%);
  --db-color-text: hsl(220, 20%, 70%);
  --db-color-dim: hsl(220, 20%, 55%);
  --db-color-line: hsl(220, 20%, 20%);
  --db-color-background: hsl(220, 20%, 10%);
  --db-color-highlight: hsl(220, 20%, 13%);
  --db-color-primary: hsl(0, 88%, 65%);
  --db-color-primary-highlight: hsl(0, 60%, 50%);
  --db-color-primary-xhighlight: hsl(0, 50%, 40%);

  --db-color-error: hsl(0, 100%, 70%);
  --db-color-warning: hsl(50, 80%, 50%);
  --db-color-success: hsl(140, 70%, 60%);
  --db-color-info: hsl(210, 80%, 70%);
  --db-color-important: hsl(300, 60%, 60%);

  --db-font-family-code: Consolas, Menlo, Monaco, monospace;
  --db-font-family-ui: system-ui, sans-serif;
  --db-border-radius: 6px;
  --db-gap: 8px;
  --db-transition: 200ms;

  all: initial;
  margin: 0;
  padding: 0;
  position: fixed;
  inset: auto auto 0 50%;
  background: none;
  transform: translateX(-50%);
  width: min(1200px, 100% - 40px);
  pointer-events: none;
  text-rendering: auto;
  overflow-wrap: break-word;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  -webkit-text-size-adjust: 100%;
  tab-size: 4;
  border: none;
  transition: opacity 200ms;

  @media (max-width: 600px) {
    width: min(600px - 40px, 100%);
  }
  @media (prefers-reduced-motion) {
    --db-transition: 0;
  }
}

:host(.is-closed) {
  opacity: 0;

  .bar {
    width: min-content;

    @media (max-width: 560px) {
      border-radius: 0 var(--db-border-radius) 0 0;
    }

    .details {
      display: none;
    }

    .menu > :not(.controls) {
      display: none;
    }

    .controls {
      border-left: none;
    }
  }
}

:host(.is-closed.is-hovered) {
  opacity: 1;
}

:host(.is-closed.is-animated) {
  animation-name: hide;
  animation-duration: var(--db-transition);
  animation-delay: 1s;
  animation-fill-mode: backwards;
}
@keyframes hide {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

:host(.is-closed:hover) {
  transition: opacity var(--db-transition);
  opacity: 1;
}

lume-icon {
  display: inline-block;
  width: 16px;
  aspect-ratio: 1;

  > svg {
    display: block;
    fill: currentColor;
    width: 100%;
    height: 100%;
  }
}

.bar {
  background-color: red;
  background-color: var(--db-color-background);
  color: var(--db-color-text);
  box-sizing: border-box;
  font-family: var(--db-font-family-ui);
  font-size: 14px;
  border-radius: var(--db-border-radius) var(--db-border-radius) 0 0;
  overflow: hidden;
  pointer-events: initial;

  @media (max-width: 560px) {
    border-radius: 0;
  }
}
.menu {
  display: flex;
  margin-bottom: -1px;
  z-index: 1;

  button {
    display: flex;
    align-items: center;
    column-gap: var(--db-gap);
    background: none;
    border: none;
    border-bottom: solid 1px transparent;
    height: 40px;
    padding: 0 0.8em;
    cursor: pointer;
    font: inherit;
    color: var(--db-color-dim);
    white-space: nowrap;

    &:hover {
      color: var(--db-color-base);
    }

    &[aria-pressed="true"] {
      color: var(--db-color-base);
      background-color: var(--db-color-highlight);
      border-bottom-color: var(--db-color-highlight);
    }

    lume-icon {
      width: 20px;
    }
  }
}
.actions {
  --db-border-radius: 4px;
  margin-left: auto;
  padding: 4px 2px;

  .item-action {
    height: 32px;
    border: none;
    background-color: var(--db-color-primary-highlight);
    color: var(--db-color-base);
    
    &:hover:not([aria-pressed="true"]) {
      background-color: var(--db-color-primary-xhighlight);
    }
  }
}
.controls {
  order: 1;
  border: none;
  display: flex;
  border-left: solid 1px var(--db-color-line);
}
.tabs {
  display: flex;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--db-color-line) transparent;

  > button + button {
    border-left: solid 1px var(--db-color-line);
  }
}
.details {
  min-height: min(200px, 50vh);
  max-height: min(max(200px, 50vh), 100vh - 40px);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--db-color-line) transparent;
  border-top: solid 1px var(--db-color-line);
  background-color: var(--db-color-highlight);
}

.collection {
  list-style-type: none;
  margin: var(--db-gap) 0;
  padding: 0;
  --db-level: 0;

  > li {
    margin-top: 1px;
  }

  > li:hover:has(details),
   > li:has(> details[open]) {
    outline: solid 1px var(--db-color-line);
    background-color: var(--db-color-background);
  }

  .collection {
    margin-top: 0;
    border-left: solid 2px var(--db-color-context, var(--db-color-dim));
    padding-left: var(--db-gap);
  }
}
.collection .collection {
  --db-level: 1;
}
.collection .collection .collection {
  --db-level: 2;
}
.collection .collection .collection .collection {
  --db-level: 3;
}
.details:has(.collection-empty) {
  display: grid;
  align-content: center;
  justify-content: center;
}
.collection-empty {
  text-align: center;
  color: var(--db-color-dim);
  font-size: 16px;
}
.badge {
  --db-background: var(--db-color-dim);
  --db-color: var(--db-color-background);

  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  background-color: var(--db-background);
  color: var(--db-color);
  gap: 4px;
  height: 20px;
  min-width: 20px;
  box-sizing: border-box;
  justify-content: center;
  padding: 0 6px;
  white-space: nowrap;
  border-radius: 10px;
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.item {
  display: flex;
  column-gap: var(--db-gap);
  align-items: baseline;
  padding: 0 var(--db-gap);

  > :first-child {
    min-width: 0;
    flex: 1 1 auto;
  }
  .item {
    border-radius: var(--db-border-radius);
    padding-right: 0;
  }
}
.item-title {
  padding: var(--db-gap) 0;
  display: flex;
  align-items: center;
  column-gap: var(--db-gap);
  min-height: 40px;
  box-sizing: border-box;
  word-break: break-all;
  margin-right: 8px;
}
.item-title-content {
  flex: 1 1 auto;
  margin: 0;

  code {
    font-family: var(--db-font-family-code);
    color: var(--db-color-base);
  }

  lume-icon {
    vertical-align: middle;
    color: var(--db-color-dim);
    width: 20px;
  }

  .badge {
    color: var(--db-color-text);
    background-color: var(--db-color-line);
  }

  a {
    color: var(--db-color-primary);
    text-decoration: none;

    &:hover {
      color: var(--db-color-primary-highlight);
      text-decoration: underline;
    }
  }
}
summary.item-title {
  list-style: none;
  cursor: pointer;
  position: sticky;
  top: calc(var(--db-level) * 40px);

  &::-webkit-details-marker {
    display: none;
  }

  [open] > &,
  &:hover {
    color: var(--db-color-base);
    background-color: var(--db-color-background);
  }
  .item-details {
    margin-left: auto;
  }
}
.item-details {
  font-variant-numeric: tabular-nums;
}
.item-code {
  font-family: var(--db-font-family-code);
  overflow-x: auto;
}
.item-text {
  padding-bottom: var(--db-gap);
  margin: 0;

  a {
    color: var(--db-color-primary);
    text-decoration: none;

    &:hover {
      color: var(--db-color-primary-highlight);
      text-decoration: underline;
    }
  }
}
.item-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--db-gap);
  padding: 4px 0;
}
.item-action {
  color: var(--db-color-text);
  text-decoration: none;
  height: 32px;
  display: flex;
  align-items: center;
  column-gap: var(--db-gap);
  padding: 0 var(--db-gap);
  border-radius: var(--db-border-radius);
  border: solid 1px var(--db-color-line);
  background-color: var(--db-color-background);
  position: relative;
  transition-property: color, background-color, border-color;
  transition-duration: var(--db-transition);
  cursor: pointer;

  &:hover:not([aria-pressed="true"]) {
    background-color: var(--db-color-highlight);
    color: var(--db-color-base);
    border-color: var(--db-color-dim);
  }

  &[aria-pressed="true"] {
    background-color: transparent;
    color: transparent;
    border-color: transparent;
    cursor: default;
  }
}

/** Inline fmt elements */
red {
  color: var(--db-color-error);
}
gray {
  color: var(--db-color-dim);
}
yellow {
  color: var(--db-color-warning);
}
green {
  color: var(--db-color-success);
}
blue {
  color: var(--db-color-info);
}

.loader {
  --db-size: 8px;
  --db-color: white;
  --db-color-trans: color-mix(in srgb, var(--db-color) 15%, transparent);

  width: var(--db-size);
  height: var(--db-size);
  border-radius: var(--db-border-radius);
  background-color: var(--db-color);
  box-shadow:
    calc(var(--db-size) * 1.5) 0 var(--db-color),
    calc(var(--db-size) * -1.5) 0 var(--db-color);
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(calc(var(--db-size) / -2), calc(var(--db-size) / -2));
  animation: loader 0.5s ease-out infinite alternate;
}

@keyframes loader {
  0% {
    background-color: var(--db-color-trans);
    box-shadow:
      calc(var(--db-size) * 1.5) 0 var(--db-color-trans),
      calc(var(--db-size) * -1.5) 0 var(--db-color);
  }
  50% {
    background-color: var(--db-color);
    box-shadow:
      calc(var(--db-size) * 1.5) 0 var(--db-color-trans),
      calc(var(--db-size) * -1.5) 0 var(--db-color-trans);
  }
  100% {
    background-color: var(--db-color-trans);
    box-shadow:
      calc(var(--db-size) * 1.5) 0 var(--db-color),
      calc(var(--db-size) * -1.5) 0 var(--db-color-trans);
  }
}
`;
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
class Bar extends HTMLElement {
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
      this.actions.appendChild(this.renderAction(action));
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

/*# sourceURL=inline:lume-debugbar.js */
