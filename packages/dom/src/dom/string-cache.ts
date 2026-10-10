const upperCasedStringCache: Map<string, string> = new Map();
const lowerCasedStringCache: Map<string, string> = new Map();

export function getUpperCase(string: string): string {
  return upperCasedStringCache.get(string) ??
    upperCasedStringCache.set(string, string.toUpperCase()).get(string)!;
}

export function getLowerCase(string: string): string {
  return lowerCasedStringCache.get(string) ??
    lowerCasedStringCache.set(string, string.toLowerCase()).get(string)!;
}
