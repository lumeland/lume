import "temporal-polyfill/global";

// Uint8Array.prototype.toBase64() not available in Node 24
export function toBase64(input: ArrayBuffer | Uint8Array): string {
  return Buffer.from(input as ArrayBuffer).toString("base64");
}
