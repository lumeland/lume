import { contentType } from "../../deps/media_types.ts";
import { decodeURIComponentSafe } from "./path.ts";
import { extname, posix } from "../../deps/path.ts";

import { type FileInfo, readStream, statSync } from "../services/fs.ts";

/**
 * Note: The most part of this code is copied from
 * https://jsr.io/@std/http/1.1.4/file_server.ts
 */

const RANGE_REGEX = /bytes=(?<start>\d+)?-(?<end>\d+)?$/u;
const STATUS: Record<string, [number, string]> = {
  OK: [200, "OK"],
  NotFound: [404, "Not Found"],
  MethodNotAllowed: [405, "Method Not Allowed"],
  NotModified: [304, "Not Modified"],
  RangeNotSatisfiable: [416, "Range Not Satisfiable"],
  PartialContent: [206, "Partial Content"],
  MovedPermanently: [301, "Moved Permanently"],
};

export async function serveFile(root: string, req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = posix.normalize(decodeURIComponentSafe(url.pathname));
  const fullPath = posix.join(root, pathname);
  let filePath = fullPath.endsWith("/") ? `${fullPath}index.html` : fullPath;
  let fileInfo = getInfo(filePath);

  const headers = new Headers({
    Server: "Lume",
  });

  if (fileInfo?.isDirectory) {
    headers.set("Location", posix.join(pathname, "/") + url.search);
    return createResponse(STATUS.MovedPermanently, headers, null);
  }

  // Exists a HTML file with this name?
  if (!fileInfo && !posix.extname(filePath)) {
    filePath = `${filePath}.html`;
    fileInfo = getInfo(filePath);
  }

  if (!fileInfo) {
    return createResponse(STATUS.NotFound, headers);
  }

  await req.body?.cancel();

  if (req.method !== "GET" && req.method !== "HEAD") {
    return createResponse(STATUS.MethodNotAllowed);
  }

  if (fileInfo.isDirectory) {
    return createResponse(STATUS.NotFound);
  }

  headers.set("Accept-Ranges", "bytes");

  // Set last modified header if last modification timestamp is available
  if (fileInfo.mtime) {
    headers.set("Last-Modified", fileInfo.mtime.toUTCString());
  }

  // Set mime-type using the file extension in filePath
  const contentTypeValue = contentType(extname(filePath));
  if (contentTypeValue) {
    // Fix for https://github.com/lumeland/lume/issues/734
    headers.set(
      "Content-Type",
      contentTypeValue === "application/rss+xml" ? "application/xml" : contentTypeValue,
    );
  }

  const fileSize = fileInfo.size;

  if (fileInfo.mtime) {
    const ifModifiedSinceValue = req.headers.get("If-Modified-Since");

    if (
      ifModifiedSinceValue &&
      fileInfo.mtime.getTime() < new Date(ifModifiedSinceValue).getTime() + 1000
    ) {
      return createResponse(STATUS.NotModified, headers, null);
    }
  }

  if (req.method === "HEAD") {
    headers.set("Content-Length", `${fileSize}`);
    return createResponse(STATUS.OK, headers, null);
  }

  const rangeValue = req.headers.get("Range");

  if (rangeValue && 0 < fileSize) {
    const parsed = parseRangeHeader(rangeValue, fileSize);

    // Returns 200 OK if parsing the range header fails
    if (!parsed) {
      headers.set("Content-Length", `${fileSize}`);

      const file = readStream(filePath);
      return createResponse(STATUS.OK, headers, file.readable);
    }

    // Return 416 Range Not Satisfiable if invalid range header value
    if (parsed.end < 0 || parsed.end < parsed.start || fileSize <= parsed.start) {
      headers.set("Content-Range", `bytes */${fileSize}`);

      return createResponse(STATUS.RangeNotSatisfiable, headers);
    }

    // clamps the range header value
    const start = Math.max(0, parsed.start);
    const end = Math.min(parsed.end, fileSize - 1);

    headers.set("Content-range", `bytes ${start}-${end}/${fileSize}`);

    const contentLength = end - start + 1;
    headers.set("Content-Length", `${contentLength}`);

    // Return 206 Partial Content
    const file = readStream(filePath, start);

    const sliced = file.readable.pipeThrough(new ByteSliceStream(0, contentLength - 1));

    return createResponse(STATUS.PartialContent, headers, sliced);
  }

  // Set content length
  headers.set("Content-Length", `${fileSize}`);

  const file = readStream(filePath);
  return createResponse(STATUS.OK, headers, file.readable);
}

function createResponse(
  [status, statusText]: [number, string],
  headers?: Headers,
  body?: BodyInit | null,
): Response {
  body = body === undefined ? statusText : body;
  return new Response(body, { status, statusText, headers });
}

/**
 * Parse range header.
 * Note: Currently, no support for multiple Ranges (e.g. `bytes=0-10, 20-30`)
 */
function parseRangeHeader(rangeValue: string, fileSize: number) {
  const parsed = rangeValue.match(RANGE_REGEX);

  if (!parsed || !parsed.groups) {
    return null;
  }

  const { start, end } = parsed.groups;

  if (start !== undefined) {
    if (end !== undefined) {
      return { start: +start, end: +end };
    }
    return { start: +start, end: fileSize - 1 };
  }

  // example: `bytes=-100` means the last 100 bytes.
  if (end !== undefined) {
    return { start: fileSize - +end, end: fileSize - 1 };
  }

  return null;
}

function getInfo(path: string): FileInfo | undefined {
  try {
    return statSync(path);
  } catch {
    // Ignore
  }
}

class ByteSliceStream extends TransformStream<Uint8Array, Uint8Array> {
  #offsetStart = 0;
  #offsetEnd = 0;

  constructor(start = 0, end: number = Infinity) {
    super({
      start: () => {
        if (start < 0) {
          throw new RangeError(
            `Cannot construct ByteSliceStream as start must be >= 0: received ${start}`,
          );
        }
        end += 1;
      },
      transform: (chunk, controller) => {
        this.#offsetStart = this.#offsetEnd;
        this.#offsetEnd += chunk.byteLength;
        if (this.#offsetEnd > start) {
          if (this.#offsetStart < start) {
            chunk = chunk.slice(start - this.#offsetStart);
          }
          if (this.#offsetEnd >= end) {
            chunk = chunk.slice(0, chunk.byteLength - this.#offsetEnd + end);
            controller.enqueue(chunk);
            controller.terminate();
          } else {
            controller.enqueue(chunk);
          }
        }
      },
    });
  }
}
