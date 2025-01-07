import {
  type ImportMap,
  resolveImportMap,
  resolveModuleSpecifier,
} from "https://cdn.jsdelivr.net/gh/lumeland/importmap@0.1.0/mod.ts";

export function getResolver(
  importMapBaseURL: URL,
  importMap: ImportMap,
): (specifier: string, fromURL?: string) => string {
  const resolvedImportMap = resolveImportMap(importMap, importMapBaseURL);
  fixImportMap(resolvedImportMap);

  return function resolveSpecifier(specifier: string, fromURL?: string) {
    return resolveModuleSpecifier(
      specifier,
      resolvedImportMap,
      importMapBaseURL,
    );
  };
}

function fixImportMap(importMap: ImportMap) {
  if (importMap.imports) {
    importMap.imports = fixImports(importMap.imports);
  }

  if (importMap.scopes) {
    const clone = { ...importMap.scopes };

    for (const [scope, imports] of Object.entries(clone)) {
      importMap.scopes[scope] = fixImports(imports)!;
    }

    importMap.scopes = clone;
  }

  return importMap;
}

function fixImports(imports: ImportMap["imports"]): ImportMap["imports"] {
  const clone = { ...imports };

  for (const [key, value] of Object.entries(clone)) {
    if (value && value.startsWith("npm:") && !value.endsWith("/")) {
      clone[`${key}/`] ??= `${value}/`;
    }
  }

  return clone;
}
