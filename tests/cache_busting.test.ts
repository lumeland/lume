import { assertResponseSnapshot, getServer } from "./utils.ts";
import cacheBusting from "../middlewares/cache_busting.ts";

Deno.test("cache busting middleware", async (t) => {
  const server = getServer((request) => {
    return new Response(`${request.url}`);
  });

  server.use(cacheBusting());

  await assertResponseSnapshot(
    t,
    server,
    new Request("http://localhost/v1/styles.css"),
  );
  await assertResponseSnapshot(
    t,
    server,
    new Request("http://localhost/v2873/scripts.js"),
  );
});
