import { assertResponseSnapshot, getServer } from "./utils.ts";
import noCache from "../middlewares/no_cache.ts";

Deno.test("no cache middleware", async (t) => {
  const server = getServer(() => {
    return new Response("Hello World", {
      headers: {
        "last-modified": "Mon, 01 Jan 2000 00:00:00 GMT",
        etag: "123",
      },
    });
  });

  server.use(noCache());

  await assertResponseSnapshot(t, server);
});
