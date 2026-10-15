// @ts-expect-error: no types available
import icoEndec from "ico-endec";

export function encode(buffers: Buffer[]): Uint8Array<ArrayBuffer> {
  return icoEndec.encode(buffers);
}
