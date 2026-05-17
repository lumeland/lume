import { serveFile as _serveFile } from "jsr:@std/http@1.1.0/file-server";
import type { FileInfo } from "./runtime.ts";

export async function serveFile(
  request: Request,
  path: string,
  fileInfo?: FileInfo,
): Promise<Response> {
  const response = await _serveFile(request, path, {
    fileInfo: fileInfo as Deno.FileInfo,
  });

  // Fix for https://github.com/lumeland/lume/issues/734
  if (response.headers.get("content-type") === "application/rss+xml") {
    response.headers.set("content-type", "application/xml");
  }

  return response;
}
