import { Node } from "./node.js";
import { HTMLCollection } from "./html-collection.js";
export declare const nodeListMutatorSym: unique symbol;
export interface NodeList<T extends Node = Node> {
  new(): NodeList;
  readonly [index: number]: T;
  readonly length: number;
  [Symbol.iterator](): Generator<T>;
  item(index: number): T;
  forEach(cb: (node: T, index: number, nodeList: T[]) => void, thisArg?: NodeList | undefined): void;
  [nodeListMutatorSym](): NodeListMutator;
}
export type NodeListPublic = Omit<NodeList, typeof nodeListMutatorSym> & {
  [Symbol.hasInstance](value: any): boolean;
};
export interface NodeListMutator {
  push(...nodes: Node[]): number;
  splice(start: number, deleteCount?: number, ...items: Node[]): Node[];
  indexOf(node: Node, fromIndex?: number | undefined): number;
  indexOfElementsView(node: Node, fromIndex?: number | undefined): number;
  elementsView(): HTMLCollection;
}
export declare const NodeList: NodeList;
export declare const NodeListPublic: NodeListPublic;
//# sourceMappingURL=node-list.d.ts.map