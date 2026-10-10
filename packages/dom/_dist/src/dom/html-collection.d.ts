import type { Element } from "./element.js";
export declare const HTMLCollectionMutatorSym: unique symbol;
export interface HTMLCollection {
  new(): HTMLCollection;
  readonly [index: number]: Element;
  readonly length: number;
  [Symbol.iterator](): Generator<Element>;
  item(index: number): Element;
  [HTMLCollectionMutatorSym](): HTMLCollectionMutator;
}
export interface HTMLCollectionPublic extends HTMLCollection {
  [HTMLCollectionMutatorSym]: never;
}
export interface HTMLCollectionMutator {
  push(...elements: Element[]): number;
  splice(start: number, deleteCount?: number, ...items: Element[]): Element[];
  indexOf(element: Element, fromIndex?: number | undefined): number;
}
export declare const HTMLCollection: HTMLCollection;
export declare const HTMLCollectionPublic: HTMLCollectionPublic;
//# sourceMappingURL=html-collection.d.ts.map