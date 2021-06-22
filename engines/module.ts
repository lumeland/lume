import Engine from "./engine.ts";
import { Data } from "../types.ts";

export default class Module extends Engine {
  helpers: Record<string, unknown> = {};

  render(
    content:
      | string
      | ((data: Data, filters: Record<string, unknown>) => unknown),
    data: Data,
  ): unknown {
    return typeof content === "function"
      ? content(data, this.helpers)
      : content;
  }

  addHelper(name: string, fn: (...args: unknown[]) => unknown) {
    this.helpers[name] = fn;
  }
}
