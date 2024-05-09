import textLoader from "./text.ts";
import binaryLoader from "./binary.ts";
import type { RawData } from "../file.ts";

export type Loader = (path: string) => Promise<RawData>;

const binaryFormats = new Set<string>([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".avif",
  ".pdf",
  ".mp4",
  ".webm",
  ".mov",
  ".zip",
  ".gz",
  ".tar",
  ".tgz",
  ".rar",
  ".7z",
  ".bz2",
  ".mp3",
  ".wav",
  ".ogg",
  ".flac",
]);

export default function getLoader(extension: string): Loader {
  if (binaryFormats.has(extension)) {
    return binaryLoader;
  }

  return textLoader;
}
