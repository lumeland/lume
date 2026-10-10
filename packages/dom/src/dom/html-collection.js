const HTMLCollectionFakeClass = (()=>{
  var _computedKey;
  _computedKey = Symbol.hasInstance;
  return class HTMLCollection {
    constructor(){
      throw new TypeError("Illegal constructor");
    }
    static [_computedKey](value) {
      return value?.constructor === HTMLCollectionClass;
    }
  };
})();
export const HTMLCollectionMutatorSym = Symbol("HTMLCollectionMutatorSym");
// We define the `HTMLCollection` inside a closure to ensure that its
// `.name === "HTMLCollection"` property stays intact, as we need to manipulate
// its prototype and completely change its TypeScript-recognized type.
const HTMLCollectionClass = (()=>{
  // @ts-ignore
  class HTMLCollection extends Array {
    forEach(cb, thisArg) {
      super.forEach(cb, thisArg);
    }
    item(index) {
      return this[index] ?? null;
    }
    [HTMLCollectionMutatorSym]() {
      return {
        push: Array.prototype.push.bind(this),
        splice: Array.prototype.splice.bind(this),
        indexOf: Array.prototype.indexOf.bind(this)
      };
    }
    toString() {
      return "[object HTMLCollection]";
    }
  }
  return HTMLCollection;
})();
for (const staticMethod of [
  "from",
  "isArray",
  "of"
]){
  HTMLCollectionClass[staticMethod] = undefined;
}
for (const instanceMethod of [
  "concat",
  "copyWithin",
  "every",
  "fill",
  "filter",
  "find",
  "findIndex",
  "flat",
  "flatMap",
  "includes",
  "indexOf",
  "join",
  "lastIndexOf",
  "map",
  "pop",
  "push",
  "reduce",
  "reduceRight",
  "reverse",
  "shift",
  "slice",
  "some",
  "sort",
  "splice",
  "toLocaleString",
  "unshift",
  // Unlike NodeList, HTMLCollection also doesn't implement these
  "entries",
  "forEach",
  "keys",
  "values"
]){
  HTMLCollectionClass.prototype[instanceMethod] = undefined;
}
export const HTMLCollection = HTMLCollectionClass;
export const HTMLCollectionPublic = HTMLCollectionFakeClass;
//# sourceMappingURL=html-collection.js.map