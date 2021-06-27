import Engine from "./engine.ts";
import { Data, Helper } from "../types.ts";

export type Content =
  | string
  | ((data: Data, helpers: Record<string, Helper>) => unknown);

export default class Module extends Engine {
  helpers: Record<string, Helper> = {};

  async render(content: Content, data: Data) {
    return typeof content === "function"
      ? await content(data, this.helpers)
      : content;
  }

  addHelper(name: string, fn: Helper) {
    this.helpers[name] = fn;
  }
}
