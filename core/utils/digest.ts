import { crypto } from "../../deps/crypto.ts";
import { encodeHex } from "../../deps/hex.ts";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

/** Digest a message using SHA-1 algorithm */
export async function sha1(message: string | Uint8Array): Promise<string> {
  if (typeof message === "string") {
    message = encoder.encode(message);
  }

  const hash = await crypto.subtle.digest("SHA-1", message);
  return decoder.decode(hash);
}

/** Digest a message using MD5 algorithm */
export async function md5(message: string | Uint8Array): Promise<string> {
  if (typeof message === "string") {
    message = encoder.encode(message);
  }

  const hash = await crypto.subtle.digest("MD5", message);
  return encodeHex(hash);
}
