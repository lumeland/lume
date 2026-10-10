import type { Element } from "../element.js";
import type { Document } from "../document.js";
export type Selector = (doc: Document) => {
  first(selector: string, context: Element | Document, callback?: (element: Element) => void): Element | null;
  match(selector: string, context: Element | Document, callback?: (element: Element) => void): boolean;
  select(selector: string, context: Element | Document, callback?: (element: Element) => void): Element[];
};
export type SelectorApi = ReturnType<Selector>;
/**
 * Explicitly disable querySelector/All code generation with the `Function`
 * constructor forcing the Sizzle engine. Enables those APIs on platforms
 * like Deno Deploy that don't allow code generation.
 */ export declare function disableCodeGeneration(): void;
//# sourceMappingURL=selectors.d.ts.map