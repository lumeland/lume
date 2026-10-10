import { CTOR_KEY } from "../constructor-lock.js";
import { NodeList, nodeListMutatorSym } from "./node-list.js";
import { insertBeforeAfter, isDocumentFragment, moveDocumentFragmentChildren } from "./utils.js";
export var NodeType = /*#__PURE__*/ function(NodeType) {
  NodeType[NodeType["ELEMENT_NODE"] = 1] = "ELEMENT_NODE";
  NodeType[NodeType["ATTRIBUTE_NODE"] = 2] = "ATTRIBUTE_NODE";
  NodeType[NodeType["TEXT_NODE"] = 3] = "TEXT_NODE";
  NodeType[NodeType["CDATA_SECTION_NODE"] = 4] = "CDATA_SECTION_NODE";
  NodeType[NodeType["ENTITY_REFERENCE_NODE"] = 5] = "ENTITY_REFERENCE_NODE";
  NodeType[NodeType["ENTITY_NODE"] = 6] = "ENTITY_NODE";
  NodeType[NodeType["PROCESSING_INSTRUCTION_NODE"] = 7] = "PROCESSING_INSTRUCTION_NODE";
  NodeType[NodeType["COMMENT_NODE"] = 8] = "COMMENT_NODE";
  NodeType[NodeType["DOCUMENT_NODE"] = 9] = "DOCUMENT_NODE";
  NodeType[NodeType["DOCUMENT_TYPE_NODE"] = 10] = "DOCUMENT_TYPE_NODE";
  NodeType[NodeType["DOCUMENT_FRAGMENT_NODE"] = 11] = "DOCUMENT_FRAGMENT_NODE";
  NodeType[NodeType["NOTATION_NODE"] = 12] = "NOTATION_NODE";
  return NodeType;
}({});
/**
 * Throws if any of the nodes are an ancestor
 * of `parentNode`
 */ export function nodesAndTextNodes(nodes, parentNode) {
  return nodes.flatMap((n)=>{
    if (isDocumentFragment(n)) {
      const children = Array.from(n.childNodes);
      moveDocumentFragmentChildren(n, parentNode);
      return children;
    } else {
      const node = n instanceof Node ? n : new Text(String(n));
      // Make sure the node isn't an ancestor of parentNode
      if (n === node && parentNode) {
        parentNode._assertNotAncestor(node);
      }
      // Remove from parentNode (if any)
      node._remove(true);
      // Set new parent
      node._setParent(parentNode, true);
      return [
        node
      ];
    }
  });
}
export class Node extends EventTarget {
  nodeName;
  nodeType;
  #nodeValue;
  parentNode;
  #ownerDocument;
  get parentElement() {
    if (this.parentNode?.nodeType === NodeType.ELEMENT_NODE) {
      return this.parentNode;
    }
    return null;
  }
  // Instance constants defined after Node
  // class body below to avoid clutter
  static ELEMENT_NODE = NodeType.ELEMENT_NODE;
  static ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE;
  static TEXT_NODE = NodeType.TEXT_NODE;
  static CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE;
  static ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE;
  static ENTITY_NODE = NodeType.ENTITY_NODE;
  static PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE;
  static COMMENT_NODE = NodeType.COMMENT_NODE;
  static DOCUMENT_NODE = NodeType.DOCUMENT_NODE;
  static DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE;
  static DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE;
  static NOTATION_NODE = NodeType.NOTATION_NODE;
  constructor(nodeName, nodeType, parentNode, key){
    if (key !== CTOR_KEY) {
      throw new TypeError("Illegal constructor.");
    }
    super(), this.nodeName = nodeName, this.nodeType = nodeType, this.#nodeValue = null, this.parentNode = null, this.#ownerDocument = null, this.#childNodes = null;
    this.#nodeValue = null;
    if (parentNode) {
      parentNode.appendChild(this);
    }
  }
  #childNodes;
  get childNodes() {
    return this.#childNodes || (this.#childNodes = new NodeList());
  }
  _getChildNodesMutator() {
    return this.childNodes[nodeListMutatorSym]();
  }
  _hasInitializedChildNodes() {
    return Boolean(this.#childNodes);
  }
  /**
   * Update ancestor chain & owner document for this child
   * and all its children.
   */ _setParent(newParent, force = false) {
    const sameParent = this.parentNode === newParent;
    const shouldUpdateParentAndAncestors = !sameParent || force;
    if (shouldUpdateParentAndAncestors) {
      this.parentNode = newParent;
      if (newParent) {
        if (!sameParent) {
          this._setOwnerDocument(newParent.#ownerDocument);
        }
      }
      // Update ancestors for child nodes
      if (this._hasInitializedChildNodes()) {
        for (const child of this.childNodes){
          child._setParent(this, shouldUpdateParentAndAncestors);
        }
      }
    }
  }
  _assertNotAncestor(child) {
    // Check this child isn't an ancestor
    if (child.contains(this)) {
      throw new DOMException("The new child is an ancestor of the parent");
    }
  }
  _setOwnerDocument(document) {
    if (this.#ownerDocument !== document) {
      this.#ownerDocument = document;
      if (this._hasInitializedChildNodes()) {
        for (const child of this.childNodes){
          child._setOwnerDocument(document);
        }
      }
    }
  }
  contains(child) {
    let node = child;
    while(node){
      if (node === this) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }
  get ownerDocument() {
    return this.#ownerDocument;
  }
  get nodeValue() {
    return this.#nodeValue;
  }
  set nodeValue(value) {
  // Setting is ignored
  }
  get textContent() {
    let out = "";
    for (const child of this.childNodes){
      switch(child.nodeType){
        case NodeType.TEXT_NODE:
          out += child.nodeValue;
          break;
        case NodeType.ELEMENT_NODE:
          out += child.textContent;
          break;
      }
    }
    return out;
  }
  set textContent(content) {
    for (const child of this.childNodes){
      child._setParent(null);
    }
    this._getChildNodesMutator().splice(0, this.childNodes.length);
    this.appendChild(new Text(content));
  }
  get firstChild() {
    if (!this._hasInitializedChildNodes()) {
      return null;
    }
    return this.childNodes[0] || null;
  }
  get lastChild() {
    if (!this._hasInitializedChildNodes()) {
      return null;
    }
    return this.childNodes[this.childNodes.length - 1] || null;
  }
  hasChildNodes() {
    return this._hasInitializedChildNodes() && Boolean(this.childNodes.length);
  }
  cloneNode(deep = false) {
    const copy = this._shallowClone();
    copy._setOwnerDocument(this.ownerDocument);
    if (deep && this._hasInitializedChildNodes()) {
      for (const child of this.childNodes){
        copy.appendChild(child.cloneNode(true));
      }
    }
    return copy;
  }
  _shallowClone() {
    throw new Error("Illegal invocation");
  }
  _remove(skipSetParent = false) {
    const parent = this.parentNode;
    if (parent) {
      const nodeList = parent._getChildNodesMutator();
      const idx = nodeList.indexOf(this);
      nodeList.splice(idx, 1);
      if (!skipSetParent) {
        this._setParent(null);
      }
    }
  }
  appendChild(child) {
    if (isDocumentFragment(child)) {
      const mutator = this._getChildNodesMutator();
      mutator.push(...child.childNodes);
      moveDocumentFragmentChildren(child, this);
      return child;
    } else {
      return child._appendTo(this);
    }
  }
  _appendTo(parentNode) {
    parentNode._assertNotAncestor(this); // FIXME: Should this really be a method?
    const oldParentNode = this.parentNode;
    // Check if we already own this child
    if (oldParentNode === parentNode) {
      if (parentNode._getChildNodesMutator().indexOf(this) !== -1) {
        return this;
      }
    } else if (oldParentNode) {
      this._remove();
    }
    this._setParent(parentNode, true);
    parentNode._getChildNodesMutator().push(this);
    return this;
  }
  removeChild(child) {
    // Just copy Firefox's error messages
    if (child && typeof child === "object") {
      if (child.parentNode === this) {
        child._remove();
        return child;
      } else {
        throw new DOMException("Node.removeChild: The node to be removed is not a child of this node");
      }
    } else {
      throw new TypeError("Node.removeChild: Argument 1 is not an object.");
    }
  }
  replaceChild(newChild, oldChild) {
    if (oldChild.parentNode !== this) {
      throw new Error("Old child's parent is not the current node.");
    }
    oldChild._replaceWith(newChild);
    return oldChild;
  }
  insertBefore(newNode, refNode) {
    this._assertNotAncestor(newNode);
    const mutator = this._getChildNodesMutator();
    if (refNode === null) {
      this.appendChild(newNode);
      return newNode;
    }
    const index = mutator.indexOf(refNode);
    if (index === -1) {
      throw new Error("DOMException: Child to insert before is not a child of this node");
    }
    if (isDocumentFragment(newNode)) {
      mutator.splice(index, 0, ...newNode.childNodes);
      moveDocumentFragmentChildren(newNode, this);
    } else {
      const oldParentNode = newNode.parentNode;
      const oldMutator = oldParentNode?._getChildNodesMutator();
      if (oldMutator) {
        oldMutator.splice(oldMutator.indexOf(newNode), 1);
      }
      newNode._setParent(this, oldParentNode !== this);
      mutator.splice(index, 0, newNode);
    }
    return newNode;
  }
  _replaceWith(...nodes) {
    if (this.parentNode) {
      const parentNode = this.parentNode;
      const mutator = parentNode._getChildNodesMutator();
      let viableNextSibling = null;
      {
        const thisIndex = mutator.indexOf(this);
        for(let i = thisIndex + 1; i < parentNode.childNodes.length; i++){
          if (!nodes.includes(parentNode.childNodes[i])) {
            viableNextSibling = parentNode.childNodes[i];
            break;
          }
        }
      }
      nodes = nodesAndTextNodes(nodes, parentNode);
      let index = viableNextSibling ? mutator.indexOf(viableNextSibling) : parentNode.childNodes.length;
      let deleteNumber;
      if (parentNode.childNodes[index - 1] === this) {
        index--;
        deleteNumber = 1;
      } else {
        deleteNumber = 0;
      }
      mutator.splice(index, deleteNumber, ...nodes);
      this._setParent(null);
    }
  }
  get nextSibling() {
    const parent = this.parentNode;
    if (!parent) {
      return null;
    }
    const index = parent._getChildNodesMutator().indexOf(this);
    const next = parent.childNodes[index + 1] || null;
    return next;
  }
  get previousSibling() {
    const parent = this.parentNode;
    if (!parent) {
      return null;
    }
    const index = parent._getChildNodesMutator().indexOf(this);
    const prev = parent.childNodes[index - 1] || null;
    return prev;
  }
  // Node.compareDocumentPosition()'s bitmask values
  static DOCUMENT_POSITION_DISCONNECTED = 1;
  static DOCUMENT_POSITION_PRECEDING = 2;
  static DOCUMENT_POSITION_FOLLOWING = 4;
  static DOCUMENT_POSITION_CONTAINS = 8;
  static DOCUMENT_POSITION_CONTAINED_BY = 16;
  static DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = 32;
  /**
   * FIXME: Does not implement attribute node checks
   * ref: https://dom.spec.whatwg.org/#dom-node-comparedocumentposition
   * MDN: https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition
   */ compareDocumentPosition(other) {
    if (other === this) {
      return 0;
    }
    // Note: major browser implementations differ in their rejection error of
    // non-Node or nullish values so we just copy the most relevant error message
    // from Firefox
    if (!(other instanceof Node)) {
      throw new TypeError("Node.compareDocumentPosition: Argument 1 does not implement interface Node.");
    }
    let node1Root = other;
    let node2Root = this;
    const node1Hierarchy = [
      node1Root
    ];
    const node2Hierarchy = [
      node2Root
    ];
    while(node1Root.parentNode ?? node2Root.parentNode){
      node1Root = node1Root.parentNode ? (node1Hierarchy.push(node1Root.parentNode), node1Root.parentNode) : node1Root;
      node2Root = node2Root.parentNode ? (node2Hierarchy.push(node2Root.parentNode), node2Root.parentNode) : node2Root;
    }
    // Check if they don't share the same root node
    if (node1Root !== node2Root) {
      return Node.DOCUMENT_POSITION_DISCONNECTED | Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC | Node.DOCUMENT_POSITION_PRECEDING;
    }
    const longerHierarchy = node1Hierarchy.length > node2Hierarchy.length ? node1Hierarchy : node2Hierarchy;
    const shorterHierarchy = longerHierarchy === node1Hierarchy ? node2Hierarchy : node1Hierarchy;
    // Check if either is a container of the other
    if (longerHierarchy[longerHierarchy.length - shorterHierarchy.length] === shorterHierarchy[0]) {
      return longerHierarchy === node1Hierarchy ? Node.DOCUMENT_POSITION_CONTAINED_BY | Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_CONTAINS | Node.DOCUMENT_POSITION_PRECEDING;
    }
    // Find their first common ancestor and see whether they
    // are preceding or following
    const longerStart = longerHierarchy.length - shorterHierarchy.length;
    for(let i = shorterHierarchy.length - 1; i >= 0; i--){
      const shorterHierarchyNode = shorterHierarchy[i];
      const longerHierarchyNode = longerHierarchy[longerStart + i];
      // We found the first common ancestor
      if (longerHierarchyNode !== shorterHierarchyNode) {
        const siblings = shorterHierarchyNode.parentNode._getChildNodesMutator();
        if (siblings.indexOf(shorterHierarchyNode) < siblings.indexOf(longerHierarchyNode)) {
          // Shorter is before longer
          if (shorterHierarchy === node1Hierarchy) {
            // Other is before this
            return Node.DOCUMENT_POSITION_PRECEDING;
          } else {
            // This is before other
            return Node.DOCUMENT_POSITION_FOLLOWING;
          }
        } else {
          // Longer is before shorter
          if (longerHierarchy === node1Hierarchy) {
            // Other is before this
            return Node.DOCUMENT_POSITION_PRECEDING;
          } else {
            // Other is after this
            return Node.DOCUMENT_POSITION_FOLLOWING;
          }
        }
      }
    }
    // FIXME: Should probably throw here because this
    // point should be unreachable code as per the
    // intended logic
    return Node.DOCUMENT_POSITION_FOLLOWING;
  }
  getRootNode(opts = {}) {
    if (this.parentNode) {
      return this.parentNode.getRootNode(opts);
    }
    if (opts.composed && this.host) {
      return this.host.getRootNode(opts);
    }
    return this;
  }
}
Node.prototype.ELEMENT_NODE = NodeType.ELEMENT_NODE;
Node.prototype.ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE;
Node.prototype.TEXT_NODE = NodeType.TEXT_NODE;
Node.prototype.CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE;
Node.prototype.ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE;
Node.prototype.ENTITY_NODE = NodeType.ENTITY_NODE;
Node.prototype.PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE;
Node.prototype.COMMENT_NODE = NodeType.COMMENT_NODE;
Node.prototype.DOCUMENT_NODE = NodeType.DOCUMENT_NODE;
Node.prototype.DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE;
Node.prototype.DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE;
Node.prototype.NOTATION_NODE = NodeType.NOTATION_NODE;
export class CharacterData extends Node {
  #nodeValue = "";
  constructor(data, nodeName, nodeType, parentNode, key){
    super(nodeName, nodeType, parentNode, key);
    this.#nodeValue = data;
  }
  get nodeValue() {
    return this.#nodeValue;
  }
  set nodeValue(value) {
    this.#nodeValue = String(value ?? "");
  }
  get data() {
    return this.#nodeValue;
  }
  set data(value) {
    this.nodeValue = value;
  }
  get textContent() {
    return this.#nodeValue;
  }
  set textContent(value) {
    this.nodeValue = value;
  }
  get length() {
    return this.data.length;
  }
  before(...nodes) {
    if (this.parentNode) {
      insertBeforeAfter(this, nodes, true);
    }
  }
  after(...nodes) {
    if (this.parentNode) {
      insertBeforeAfter(this, nodes, false);
    }
  }
  remove() {
    this._remove();
  }
  replaceWith(...nodes) {
    this._replaceWith(...nodes);
  }
}
export class Text extends CharacterData {
  constructor(text = ""){
    super(String(text), "#text", NodeType.TEXT_NODE, null, CTOR_KEY);
  }
  _shallowClone() {
    return new Text(this.textContent);
  }
}
export class Comment extends CharacterData {
  constructor(text = ""){
    super(String(text), "#comment", NodeType.COMMENT_NODE, null, CTOR_KEY);
  }
  _shallowClone() {
    return new Comment(this.textContent);
  }
  get textContent() {
    return this.nodeValue;
  }
}
//# sourceMappingURL=node.js.map