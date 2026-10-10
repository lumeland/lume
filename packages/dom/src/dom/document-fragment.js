import { CTOR_KEY } from "../constructor-lock.js";
import { NodeList, nodeListMutatorSym } from "./node-list.js";
import { Node, nodesAndTextNodes, NodeType } from "./node.js";
import { customByClassNameSym, customByTagNameSym } from "./selectors/custom-api.js";
import { getElementsByClassName } from "./utils.js";
import UtilTypes from "./utils-types.js";
export class DocumentFragment extends Node {
  constructor(){
    super("#document-fragment", NodeType.DOCUMENT_FRAGMENT_NODE, null, CTOR_KEY);
  }
  get childElementCount() {
    return this._getChildNodesMutator().elementsView().length;
  }
  get children() {
    return this._getChildNodesMutator().elementsView();
  }
  get firstElementChild() {
    const elements = this._getChildNodesMutator().elementsView();
    return elements[0] ?? null;
  }
  get lastElementChild() {
    const elements = this._getChildNodesMutator().elementsView();
    return elements[elements.length - 1] ?? null;
  }
  _shallowClone() {
    return new DocumentFragment();
  }
  append(...nodes) {
    const mutator = this._getChildNodesMutator();
    mutator.push(...nodesAndTextNodes(nodes, this));
  }
  prepend(...nodes) {
    const mutator = this._getChildNodesMutator();
    mutator.splice(0, 0, ...nodesAndTextNodes(nodes, this));
  }
  replaceChildren(...nodes) {
    const mutator = this._getChildNodesMutator();
    // Remove all current child nodes
    for (const child of this.childNodes){
      child._setParent(null);
    }
    mutator.splice(0, this.childNodes.length);
    // Add new children
    mutator.splice(0, 0, ...nodesAndTextNodes(nodes, this));
  }
  // TODO: DRY!!!
  getElementById(id) {
    for (const child of this.childNodes){
      if (child.nodeType === NodeType.ELEMENT_NODE) {
        if (child.id === id) {
          return child;
        }
        const search = child.getElementById(id);
        if (search) {
          return search;
        }
      }
    }
    return null;
  }
  querySelector(selectors) {
    if (!this.ownerDocument) {
      throw new Error("DocumentFragment must have an owner document");
    }
    return this.ownerDocument._nwapi.first(selectors, this);
  }
  querySelectorAll(selectors) {
    if (!this.ownerDocument) {
      throw new Error("DocumentFragment must have an owner document");
    }
    const nodeList = new NodeList();
    const mutator = nodeList[nodeListMutatorSym]();
    mutator.push(...this.ownerDocument._nwapi.select(selectors, this));
    return nodeList;
  }
}
UtilTypes.DocumentFragment = DocumentFragment;
// Add required methods just for Sizzle.js selector to work on
// DocumentFragment's
function documentFragmentGetElementsByTagName(tagName) {
  const search = [];
  if (tagName === "*") {
    return documentFragmentGetElementsByTagNameWildcard(this, search);
  }
  for (const child of this.childNodes){
    if (child.nodeType === NodeType.ELEMENT_NODE) {
      if (child.tagName === tagName) {
        search.push(child);
      }
      child._getElementsByTagName(tagName, search);
    }
  }
  return search;
}
function documentFragmentGetElementsByClassName(className) {
  return getElementsByClassName(this, className.trim().split(/\s+/), []);
}
function documentFragmentGetElementsByTagNameWildcard(fragment, search) {
  for (const child of fragment.childNodes){
    if (child.nodeType === NodeType.ELEMENT_NODE) {
      search.push(child);
      child._getElementsByTagNameWildcard(search);
    }
  }
  return search;
}
DocumentFragment.prototype[customByTagNameSym] = documentFragmentGetElementsByTagName;
DocumentFragment.prototype[customByClassNameSym] = documentFragmentGetElementsByClassName;
//# sourceMappingURL=document-fragment.js.map