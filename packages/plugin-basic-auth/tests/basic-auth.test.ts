import { describe, it, expect } from "vitest";
import { send, getServer } from "@lumeland/testing/server.ts";
import basicAuth from "../src/mod.ts";

describe("basic-auth plugin", async () => {
  const server = getServer();

  server.use(
    basicAuth({
      users: {
        user1: "password1",
      },
    }),
  );

  it("should match unauthorized snapshot", async () => {
    expect(await send(server, new Request("https://example.com"))).toMatchSnapshot();
  });

  it("should match unauthorized snapshot (2)", async () => {
    expect(
      await send(
        server,
        new Request("https://example.com", {
          headers: { authorization: `Basic ${btoa("not:found")}` },
        }),
      ),
    ).toMatchSnapshot();
  });

  it("should match authorized snapshot", async () => {
    expect(
      await send(
        server,
        new Request("https://example.com", {
          headers: { authorization: `Basic ${btoa("user1:password1")}` },
        }),
      ),
    ).toMatchSnapshot();
  });
});
