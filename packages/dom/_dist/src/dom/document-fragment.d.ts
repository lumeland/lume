import { HTMLCollection } from "./html-collection.js";
import { NodeList } from "./node-list.js";
import { Node } from "./node.js";
import { Element } from "./element.js";
export declare class DocumentFragment extends Node {
  constructor();
  get childElementCount(): number;
  get children(): HTMLCollection;
  get firstElementChild(): Element | null;
  get lastElementChild(): Element | null;
  override _shallowClone(): DocumentFragment;
  append(...nodes: (Node | string)[]): void;
  prepend(...nodes: (Node | string)[]): void;
  replaceChildren(...nodes: (Node | string)[]): void;
  getElementById(id: string): Element | null;
  querySelector(selectors: string): Element | null;
  querySelectorAll(selectors: string): NodeList;
}
//# sourceMappingURL=document-fragment.d.ts.map