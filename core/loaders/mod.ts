import textLoader from "./text.ts";
import binaryLoader from "./binary.ts";
import { typeByExtension } from "../../deps/media_types.ts";

import type { RawData } from "../file.ts";

export type Loader = (path: string) => Promise<RawData>;

export default function getLoader(extension: string): Loader {
  const mediaType = typeByExtension(extension)?.split("/");

  if (!mediaType) {
    return binaryLoader;
  }

  const [type, subtype] = mediaType;

  // Special case for XML and SVG
  if (subtype.includes("xml")) {
    return textLoader;
  }

  if (type === "text") {
    return textLoader;
  }

  return binaryLoader;
}
