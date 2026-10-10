export { nodesFromString } from "./deserialize.js";
export * from "./dom/node.js";
export * from "./dom/element.js";
export * from "./dom/document.js";
export * from "./dom/document-fragment.js";
export * from "./dom/dom-parser.js";
export * from "./dom/elements/html-template-element.js";
export { disableCodeGeneration as denoDomDisableQuerySelectorCodeGeneration } from "./dom/selectors/selectors.js";

// Re-export private constructors without constructor signature
import {
  CharacterData as ConstructibleCharacterData,
  Node as ConstructibleNode,
} from "./dom/node.js";

import { HTMLDocument as ConstructibleHTMLDocument } from "./dom/document.js";

import {
  Attr as ConstructibleAttr,
  Element as ConstructibleElement,
} from "./dom/element.js";

export const Node:
  & Pick<
    typeof ConstructibleNode,
    keyof typeof ConstructibleNode
  >
  & Function = ConstructibleNode;
export type Node = ConstructibleNode;

export const HTMLDocument:
  & Pick<
    typeof ConstructibleHTMLDocument,
    keyof typeof ConstructibleHTMLDocument
  >
  & Function = ConstructibleHTMLDocument;
export type HTMLDocument = ConstructibleHTMLDocument;

export const CharacterData:
  & Pick<
    typeof ConstructibleCharacterData,
    keyof typeof ConstructibleCharacterData
  >
  & Function = ConstructibleCharacterData;
export type CharacterData = ConstructibleCharacterData;

export const Element:
  & Pick<
    typeof ConstructibleElement,
    keyof typeof ConstructibleElement
  >
  & Function = ConstructibleElement;
export type Element = ConstructibleElement;

export const Attr:
  & Pick<
    typeof ConstructibleAttr,
    keyof typeof ConstructibleAttr
  >
  & Function = ConstructibleAttr;
export type Attr = ConstructibleAttr;

export { NodeListPublic as NodeList } from "./dom/node-list.js";
export { HTMLCollectionPublic as HTMLCollection } from "./dom/html-collection.js";

import { NodeList } from "./dom/node-list.js";
import { HTMLCollection } from "./dom/html-collection.js";

// Prevent childNodes and HTMLCollections from being seen as an arrays
const oldHasInstance = Array[Symbol.hasInstance];
Object.defineProperty(Array, Symbol.hasInstance, {
  value(value: any): boolean {
    switch (value?.constructor) {
      case HTMLCollection:
      case NodeList:
        return false;
      default:
        return oldHasInstance.call(this, value);
    }
  },
  configurable: true,
});

const oldIsArray = Array.isArray;
Object.defineProperty(Array, "isArray", {
  value: (value: any): boolean => {
    switch (value?.constructor) {
      case HTMLCollection:
      case NodeList:
        return false;
      default:
        return oldIsArray.call(Array, value);
    }
  },
  configurable: true,
});
