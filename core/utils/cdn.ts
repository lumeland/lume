import {
  canParse,
  format,
  maxSatisfying,
  parse,
  parseRange,
} from "../../deps/semver.ts";
import { fromFileUrl, globToRegExp, toFileUrl } from "../../deps/path.ts";
import { walk, type WalkOptions } from "../../deps/fs.ts";

type PackageType = "npm" | "gh";

export function getFiles(
  specifier: string,
  patterns: string[] = ["/**"],
): Promise<Map<string, string>> {
  if (specifier.startsWith("file:")) {
    return getFsFiles(specifier, patterns);
  }
  return getCDNFiles(specifier, patterns);
}

async function getCDNFiles(
  specifier: string,
  patterns: string[],
): Promise<Map<string, string>> {
  const result = parseNpm(specifier) || parseGh(specifier) ||
    parseJsDelivr(specifier);
  if (!result) {
    throw new Error(`Invalid specifier: ${specifier}`);
  }
  const [type, name, range, path] = result;
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
  const regexps = patterns.map((pattern) =>
    globToRegExp(path + pattern, { globstar: true, extended: true })
  );
  const fileMap = new Map<string, string>();

  for (const file of data.files) {
    const filename: string = file.name;

    if (!regexps.some((regexp) => regexp.test(filename))) {
      continue;
    }

    const key = path ? filename.slice(path.length) : filename;
    fileMap.set(
      key,
      `https://cdn.jsdelivr.net/${type}/${name}@${version}${filename}`,
    );
  }

  return fileMap;
}

async function getFsFiles(
  specifier: string,
  patterns: string[],
): Promise<Map<string, string>> {
  const basePath = fromFileUrl(specifier);
  const fileMap = new Map<string, string>();
  const walkOptions: WalkOptions = {
    includeDirs: false,
    followSymlinks: false,
    skip: [
      /(^|\/)\.[^\/\.]/, // hidden files
    ],
  };

  const regexps = patterns.map((pattern) =>
    globToRegExp(pattern, { globstar: true, extended: true })
  );

  for await (const { path } of walk(basePath, walkOptions)) {
    const filename = path.slice(basePath.length);
    if (!regexps.some((regexp) => regexp.test(filename))) {
      continue;
    }
    fileMap.set(filename, toFileUrl(path).href);
  }

  return fileMap;
}

export function isFromCdn(specifier: string): boolean {
  return specifier.startsWith("npm:") ||
    specifier.startsWith("gh:") ||
    specifier.startsWith("https://cdn.jsdelivr.net/npm/") ||
    specifier.startsWith("https://cdn.jsdelivr.net/gh/");
}

export function getFile(specifier: string): string {
  if (specifier.startsWith("npm:")) {
    return specifier.replace("npm:", "https://cdn.jsdelivr.net/npm/");
  } else if (specifier.startsWith("gh:")) {
    return specifier.replace("gh:", "https://cdn.jsdelivr.net/gh/");
  } else if (
    specifier.startsWith("https://cdn.jsdelivr.net/npm/") ||
    specifier.startsWith("https://cdn.jsdelivr.net/gh/")
  ) {
    return specifier;
  } else {
    throw new Error(`Invalid specifier: ${specifier}`);
  }
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

  const [, scope, name, , version, path] = match;
  return [
    "npm",
    (scope || "") + name,
    version || "*",
    path || "",
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

  const [, name, , version, path] = match;
  return [
    "gh",
    name,
    version || "*",
    path || "",
  ];
}

function parseJsDelivr(specifier: string): [
  PackageType,
  string,
  string,
  string,
] | undefined {
  if (specifier.startsWith("https://cdn.jsdelivr.net/npm/")) {
    return parseNpm(
      specifier.replace("https://cdn.jsdelivr.net/npm/", "npm:"),
    );
  }
  if (specifier.startsWith("https://cdn.jsdelivr.net/gh/")) {
    return parseGh(
      specifier.replace("https://cdn.jsdelivr.net/gh/", "gh:"),
    );
  }
}
