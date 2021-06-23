import Engine from "./engine.ts";
import { Data, Helper } from "../types.ts";

export default class Module extends Engine {
  helpers: Record<string, Helper> = {};

  async render(
    content: string | ((data: Data, helpers: Record<string, Helper>) => unknown),
    data: Data,
  ) {
    return typeof content === "function"
      ? await content(data, this.helpers)
      : content;
  }

  addHelper(name: string, fn: Helper) {
    this.helpers[name] = fn;
  }
}
