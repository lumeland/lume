export { renderComponent } from "lume/jsx-runtime";

const ssxElement = Symbol.for("ssx.element");
export function isComponent(obj: unknown): obj is Record<string, unknown> {
  // @ts-ignore: Property '[ssxElement]' does not exist on type '{}'
  return typeof obj === "object" && obj !== null && obj[ssxElement] === true;
}
