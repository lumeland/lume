import "npm:@lumeland/ssx@0.1.5/jsx-runtime";
export { renderComponent } from "npm:@lumeland/ssx@0.1.5/jsx-runtime";
export const specifier = "npm:@lumeland/ssx@0.1.5";

const ssxElement = Symbol.for("ssx.element");
export function isComponent(obj: unknown): obj is Record<string, unknown> {
  // @ts-ignore: Property '[ssxElement]' does not exist on type '{}'
  return typeof obj === "object" && obj !== null && obj[ssxElement] === true;
}
