import { describe, it, expect } from "vitest";
import { send, getServer } from "@lumeland/testing/server.ts";
import Router from "../src/mod.ts";

describe("router plugin", async () => {
  it("should match routes snapshots", async () => {
    const server = getServer(() => new Response("not found", { status: 404 }));

    const router = new Router();
    router.get("/get", () => Response.json({ get: "ok" }));
    router.get("/get/:name", ({ name }) => Response.json({ get: "ok", name }));
    router.post("/post", () => Response.json({ post: "ok" }));
    router.put("/put", () => Response.json({ put: "ok" }));

    server.use(router.middleware());

    expect(
      await send(server, new Request("https://example.com/get", { method: "GET" })),
    ).toMatchSnapshot();
    expect(
      await send(server, new Request("https://example.com/get/lume", { method: "GET" })),
    ).toMatchSnapshot();
    expect(
      await send(server, new Request("https://example.com/post", { method: "POST" })),
    ).toMatchSnapshot();
    expect(
      await send(server, new Request("https://example.com/put", { method: "PUT" })),
    ).toMatchSnapshot();
    expect(
      await send(server, new Request("https://example.com/not-found", { method: "GET" })),
    ).toMatchSnapshot();
  });
});
