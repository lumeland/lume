import {
  canParse,
  format,
  maxSatisfying,
  parse,
  parseRange,
} from "../../deps/semver.ts";
import { globToRegExp } from "../../deps/path.ts";

type PackageType = "npm" | "gh";

export async function getFiles(
  specifier: string,
): Promise<Map<string, string>> {
  const result = parseNpm(specifier) || parseGh(specifier);
  if (!result) {
    throw new Error(`Invalid specifier: ${specifier}`);
  }
  const [type, name, range, pattern] = result;
  const version = await getVersion(type, name, range);
  if (!version) {
    throw new Error(`No matching version found for ${name}@${range}`);
  }
  const url =
    `https://data.jsdelivr.com/v1/package/${type}/${name}@${version}?structure=flat`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch package data for ${name}@${version}`);
  }
  const data = await res.json();
  const regexp = globToRegExp(pattern, { globstar: true, extended: true });
  const basePath = pattern.includes("*") ? pattern.split("/*")[0] : undefined;
  const fileMap = new Map<string, string>();

  for (const file of data.files) {
    const filename: string = file.name;

    if (!regexp.test(filename)) {
      continue;
    }

    const key = basePath ? filename.slice(basePath.length) : filename;
    fileMap.set(
      key,
      `https://cdn.jsdelivr.net/${type}/${name}@${version}${filename}`,
    );
  }

  return fileMap;
}

export function isFromCdn(specifier: string): boolean {
  return specifier.startsWith("npm:") || specifier.startsWith("gh:");
}

export function getFile(specifier: string): string {
  const result = parseNpm(specifier) || parseGh(specifier);
  if (!result) {
    throw new Error(`Invalid specifier: ${specifier}`);
  }

  const [type, name, version, filename] = result;

  if (filename.includes("*")) {
    throw new Error(`Specifier must not contain glob pattern: ${specifier}`);
  }

  return `https://cdn.jsdelivr.net/${type}/${name}@${version}${filename}`;
}

export async function getVersion(
  type: PackageType,
  name: string,
  version: string,
): Promise<string | undefined> {
  const url = `https://data.jsdelivr.com/v1/package/${type}/${name}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch latest version for ${name}`);
  }
  const data = await res.json();

  const versions = data.versions.filter(canParse).map(parse);
  const range = parseRange(version);
  const found = maxSatisfying(versions, range);
  return found ? format(found) : undefined;
}

const NPM = /^npm:(@[^/]+\/)?([^@/]+)(@([^/]+))?(\/.+)?$/;
function parseNpm(
  specifier: string,
): [PackageType, string, string, string] | undefined {
  const match = specifier.match(NPM);

  if (!match) {
    return;
  }

  const [, scope, name, , version, pattern] = match;
  return [
    "npm",
    (scope || "") + name,
    version || "*",
    pattern || "/**",
  ];
}

const GITHUB = /^gh:([^/]+\/[^/@]+)(@([^/]+))?(\/.+)?$/;
function parseGh(
  specifier: string,
): [PackageType, string, string, string] | undefined {
  const match = specifier.match(GITHUB);

  if (!match) {
    return;
  }

  const [, name, , version, pattern] = match;
  return [
    "gh",
    name,
    version || "*",
    pattern || "/**",
  ];
}
