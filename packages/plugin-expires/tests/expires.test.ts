import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { send, getServer } from "@lumeland/testing/server.ts";
import expires from "../src/mod.ts";

describe("basic-auth plugin", async () => {
  beforeEach(() => {
    vi.useFakeTimers({
      now: 1793212422025,
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const server = getServer();

  server.use(expires());

  it("should match HTML", async () => {
    expect(
      await send(
        server,
        new Request("https://example.com", {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }),
      ),
    ).toMatchSnapshot();
  });

  it("should match feed", async () => {
    expect(
      await send(
        server,
        new Request("https://example.com", {
          headers: { "Content-Type": "application/atom+xml" },
        }),
      ),
    ).toMatchSnapshot();
  });

  it("should match JavaScript", async () => {
    expect(
      await send(
        server,
        new Request("https://example.com", {
          headers: { "Content-Type": "text/javascript; charset=utf-8" },
        }),
      ),
    ).toMatchSnapshot();
  });
});
