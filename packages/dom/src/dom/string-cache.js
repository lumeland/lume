const upperCasedStringCache = new Map();
const lowerCasedStringCache = new Map();
export function getUpperCase(string) {
  return upperCasedStringCache.get(string) ?? upperCasedStringCache.set(string, string.toUpperCase()).get(string);
}
export function getLowerCase(string) {
  return lowerCasedStringCache.get(string) ?? lowerCasedStringCache.set(string, string.toLowerCase()).get(string);
}
//# sourceMappingURL=string-cache.js.map