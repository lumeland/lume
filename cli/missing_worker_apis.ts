// deno-lint-ignore-file no-explicit-any

class S implements Storage {
  #length: number = 0;
  #type?: string | undefined;
  [key: string]: any;

  constructor(type?: string) {
    this.#type = type;
  }

  get length() {
    return this.#length;
  }

  clear() {
    this.#length = 0;
    Object.keys(this).forEach((key) => {
      delete this[key];
    });
    this.#sync("clear");
  }

  getItem(key: string): string | null {
    return this[key] ?? null;
  }

  key(index: number): string | null {
    return Object.keys(this)[index] ?? null;
  }

  removeItem(key: string) {
    delete this[key];
    this.#length--;
    this.#sync("removeItem", key);
  }

  setItem(key: string, value: any) {
    this[key] = value;
    this.#length++;
    this.#sync("setItem", key, value);
  }

  #sync(method: string, ...args: unknown[]) {
    if (this.#type) {
      globalThis.postMessage({
        type: this.#type,
        method,
        args,
      });
    }
  }
}

// sessionStorage is always empty
globalThis.sessionStorage = new S();

export function initLocalStorage(data: Record<string, string>) {
  const storage = new S("localStorage");

  for (const [key, value] of Object.entries(data)) {
    storage.setItem(key, value);
  }

  globalThis.localStorage = storage;
}
