import { Data, Engine, Helper } from "../../core.ts";

export type Content =
  | string
  | ((data: Data, helpers: Record<string, Helper>) => unknown);

export default class Module implements Engine {
  helpers: Record<string, Helper> = {};

  async render(content: Content, data: Data): Promise<unknown> {
    return typeof content === "function"
      ? await content(data, this.helpers)
      : content;
  }

  addHelper(name: string, fn: Helper) {
    this.helpers[name] = fn;
  }
}
