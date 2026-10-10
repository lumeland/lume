import { Node, nodesAndTextNodes, NodeType } from "./node.js";
import UtilTypes from "./utils-types.js";
export const upperCaseCharRe = /[A-Z]/;
export const lowerCaseCharRe = /[a-z]/;
/**
 * Convert JS property name to dataset attribute name without
 * validation
 */ export function getDatasetHtmlAttrName(name) {
  let attributeName = "data-";
  for (const char of name){
    if (upperCaseCharRe.test(char)) {
      attributeName += "-" + char.toLowerCase();
    } else {
      attributeName += char;
    }
  }
  return attributeName;
}
export function getDatasetJavascriptName(name) {
  let javascriptName = "";
  let prevChar = "";
  for (const char of name.slice("data-".length)){
    if (prevChar === "-" && lowerCaseCharRe.test(char)) {
      javascriptName += char.toUpperCase();
      prevChar = "";
    } else {
      javascriptName += prevChar;
      prevChar = char;
    }
  }
  return javascriptName + prevChar;
}
export function getElementsByClassName(element, classNames, search) {
  for (const child of element.childNodes){
    if (child.nodeType === NodeType.ELEMENT_NODE) {
      let matchesCount = 0;
      for (const singleClassName of classNames){
        if (child.classList.contains(singleClassName)) {
          matchesCount++;
        }
      }
      // ensure that all class names are present
      if (matchesCount === classNames.length) {
        search.push(child);
      }
      getElementsByClassName(child, classNames, search);
    }
  }
  return search;
}
function getOuterHTMLOpeningTag(parentElement) {
  return "<" + parentElement.localName + getElementAttributesString(parentElement) + ">";
}
const voidElements = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);
/**
 * .innerHTML/.outerHTML implementation without recursion to avoid stack
 * overflows
 */ export function getOuterOrInnerHtml(parentElement, asOuterHtml) {
  let outerHTMLOpeningTag = "";
  let outerHTMLClosingTag = "";
  let innerHTML = "";
  if (asOuterHtml) {
    outerHTMLOpeningTag = getOuterHTMLOpeningTag(parentElement);
    outerHTMLClosingTag = `</${parentElement.localName}>`;
    if (voidElements.has(parentElement.localName)) {
      return outerHTMLOpeningTag;
    }
  }
  const initialChildNodes = parentElement.localName === "template" ? parentElement.content.childNodes : parentElement.childNodes;
  const childNodeDepth = [
    initialChildNodes
  ];
  const indexDepth = [
    0
  ];
  const closingTagDepth = [
    outerHTMLClosingTag
  ];
  let depth = 0;
  depthLoop: while(depth > -1){
    const child = childNodeDepth[depth][indexDepth[depth]];
    if (child) {
      switch(child.nodeType){
        case NodeType.ELEMENT_NODE:
          {
            innerHTML += getOuterHTMLOpeningTag(child);
            const childLocalName = child.localName;
            // Void elements don't have a closing tag nor print innerHTML
            if (!voidElements.has(childLocalName)) {
              if (childLocalName === "template") {
                childNodeDepth.push(child.content.childNodes);
              } else {
                childNodeDepth.push(child.childNodes);
              }
              indexDepth.push(0);
              closingTagDepth.push(`</${childLocalName}>`);
              depth++;
              continue depthLoop;
            }
            break;
          }
        case NodeType.COMMENT_NODE:
          innerHTML += `<!--${child.data}-->`;
          break;
        case NodeType.TEXT_NODE:
          // Special handling for rawtext-like elements.
          switch(child.parentNode.localName){
            case "style":
            case "script":
            case "xmp":
            case "iframe":
            case "noembed":
            case "noframes":
            case "plaintext":
              {
                innerHTML += child.data;
                break;
              }
            case "noscript":
              {
                innerHTML += child.data;
                break;
              }
            default:
              {
                // escaping: https://html.spec.whatwg.org/multipage/parsing.html#escapingString
                innerHTML += child.data.replace(/&/g, "&amp;").replace(/\xA0/g, "&nbsp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                break;
              }
          }
          break;
      }
    } else {
      depth--;
      indexDepth.pop();
      childNodeDepth.pop();
      innerHTML += closingTagDepth.pop();
    }
    // Go to next child
    indexDepth[depth]++;
  }
  // If innerHTML is requested then the opening tag should be an empty string
  return outerHTMLOpeningTag + innerHTML;
}
export function getElementAttributesString(element) {
  let out = "";
  for (const attribute of element.getAttributeNames()){
    // attribute names should already all be lower-case
    out += ` ${attribute}`;
    // escaping: https://html.spec.whatwg.org/multipage/parsing.html#escapingString
    out += `="${element.getAttribute(attribute).replace(/&/g, "&amp;").replace(/\xA0/g, "&nbsp;").replace(/"/g, "&quot;")}"`;
  }
  return out;
}
export function insertBeforeAfter(node, nodes, before) {
  const parentNode = node.parentNode;
  const mutator = parentNode._getChildNodesMutator();
  // Find the previous/next sibling to `node` that isn't in `nodes` before the
  // nodes in `nodes` are removed from their parents.
  let viablePrevNextSibling = null;
  {
    const difference = before ? -1 : +1;
    for(let i = mutator.indexOf(node) + difference; 0 <= i && i < parentNode.childNodes.length; i += difference){
      if (!nodes.includes(parentNode.childNodes[i])) {
        viablePrevNextSibling = parentNode.childNodes[i];
        break;
      }
    }
  }
  nodes = nodesAndTextNodes(nodes, parentNode);
  let index;
  if (viablePrevNextSibling) {
    index = mutator.indexOf(viablePrevNextSibling) + (before ? 1 : 0);
  } else {
    index = before ? 0 : parentNode.childNodes.length;
  }
  mutator.splice(index, 0, ...nodes);
}
export function isDocumentFragment(node) {
  let obj = node;
  if (!(obj && typeof obj === "object")) {
    return false;
  }
  while(true){
    switch(obj.constructor){
      case UtilTypes.DocumentFragment:
        return true;
      case Node:
      case UtilTypes.Element:
        return false;
      // FIXME: We should probably throw here?
      case Object:
      case null:
      case undefined:
        return false;
      default:
        obj = Reflect.getPrototypeOf(obj);
    }
  }
}
/**
 * Sets the new parent for the children via _setParent() on all
 * the child nodes and removes them from the DocumentFragment's
 * childNode list.
 *
 * A helper function for appendChild, etc. It should be called
 * _after_ the children are already pushed onto the new parent's
 * childNodes.
 */ export function moveDocumentFragmentChildren(fragment, newParent) {
  const childCount = fragment.childNodes.length;
  for (const child of fragment.childNodes){
    child._setParent(newParent);
  }
  const mutator = fragment._getChildNodesMutator();
  mutator.splice(0, childCount);
}
//# sourceMappingURL=utils.js.map