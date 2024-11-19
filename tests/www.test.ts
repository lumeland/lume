import { assertResponseSnapshot, getServer } from "./utils.ts";
import www from "../middlewares/www.ts";

Deno.test("www middleware", async (t) => {
  const server = getServer();

  server.use(www());

  await assertResponseSnapshot(t, server, new Request("http://www.localhost"));
  await assertResponseSnapshot(t, server, new Request("http://localhost"));
  await assertResponseSnapshot(t, server, new Request("https://www.localhost"));
});

Deno.test("www middleware (add www)", async (t) => {
  const server = getServer();

  server.use(www({
    add: true,
  }));

  await assertResponseSnapshot(t, server, new Request("http://www.localhost"));
  await assertResponseSnapshot(t, server, new Request("http://localhost"));
  await assertResponseSnapshot(t, server, new Request("https://www.localhost"));
});
