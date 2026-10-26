import { fromFileUrl, toFileUrl, posix } from "../deps/path.ts";
import { decodeURIComponentSafe } from "./utils/path.ts";

const WINDOWS_ABSOLUTE = /^\w:[\\/]/;
const EXTENSION = /\.\w+$/;

export default class Path {
  #drive: string | undefined;
  #path: string;

  static create(path: string | Path): Path {
    if (typeof path === "string") {
      const [d, p] = parse(path);
      return new Path(d, p);
    }

    return path;
  }

  static createDecoded(path: string): Path {
    return Path.create(decodeURIComponentSafe(path));
  }

  private constructor(drive: string | undefined, path: string) {
    this.#drive = drive;
    this.#path = path;
  }

  clone(): Path {
    return new Path(this.#drive, this.#path);
  }

  get dirname(): string {
    return posix.dirname(this.#path);
  }

  toString() {
    return this.#path;
  }

  valueOf() {
    return this.#path;
  }

  get full(): string {
    return this.#drive ? `${this.#drive}:${this.#path}` : this.#path;
  }

  get url(): URL {
    return toFileUrl(this.full);
  }

  get basename(): string {
    return posix.basename(this.#path, this.extension);
  }

  get extension(): string {
    const match = this.#path.match(EXTENSION);
    return match ? match[0].toLowerCase() : "";
  }

  set extension(ext: string) {
    const length = this.extension.length;
    this.#path = `${length ? this.#path.slice(0, -length) : this.#path}${ext}`;
  }

  join(...paths: string[]): this {
    this.#path = posix.join(this.#path, ...paths);
    return this;
  }

  removeBase(base: string | Path): this {
    this.#drive = undefined;
    base = Path.create(base).toString();

    if (base.length > 1 && base.endsWith("/")) {
      base = base.slice(0, -1);
    }

    if (this.#path === base || this.#path.startsWith(base)) {
      this.#path = posix.join("/", this.#path.slice(base.length));
    }

    return this;
  }

  addBase(base: string | Path): this {
    if (base instanceof Path) {
      this.#drive = base.#drive;
    }

    base = Path.create(base).toString();

    if (!this.#path.startsWith(base)) {
      this.#path = posix.join(base, this.#path);
    }

    return this;
  }

  belongsTo(base: string | Path): boolean {
    base = Path.create(base).toString();

    if (base.length > 1 && base.endsWith("/")) {
      base = base.slice(0, -1);
    }

    return this.#path === base || this.#path.startsWith(base);
  }

  contains(base: string | Path): boolean {
    return Path.create(base).belongsTo(this);
  }
}

function parse(path: string): [string | undefined, string] {
  let drive: string | undefined;

  if (path.startsWith("file://")) {
    path = fromFileUrl(path, { windows: false });
  }

  if (path.match(WINDOWS_ABSOLUTE)) {
    path = path.slice(2).replaceAll("\\", "/");
    drive = path[1];
  }

  path = posix.join("/", path);

  return [drive, path];
}
