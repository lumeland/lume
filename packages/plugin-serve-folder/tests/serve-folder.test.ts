import { describe, it, expect } from "vitest";
import { send, getServer } from "@lumeland/testing/server.ts";
import serveFolder from "../src/mod.ts";

describe("serve-folder plugin", async () => {
  it("should match before behavior", async () => {
    const server = getServer();

    server.use(
      serveFolder({
        root: import.meta.resolve("./assets"),
      }),
    );

    expect(await send(server, "https://example.com/index.html")).toMatchSnapshot();
    expect(await send(server, "https://example.com/other.html")).toMatchSnapshot();
  });

  it("should match after behavior", async () => {
    const server = getServer(() => new Response(null, { status: 404 }));

    server.use(
      serveFolder({
        root: import.meta.resolve("./assets"),
        after: true,
      }),
    );

    expect(await send(server, "https://example.com/index.html")).toMatchSnapshot();
    expect(await send(server, "https://example.com/other.html")).toMatchSnapshot();
  });
});
