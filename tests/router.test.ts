import { assertResponseSnapshot, getServer } from "./utils.ts";
import Router from "../middlewares/router.ts";

Deno.test("simple routes", async (t) => {
  const server = getServer(() => new Response("Not Found", { status: 404 }));

  const router = new Router();

  router.get("/hello", () => new Response("Hello World from GET"));
  router.post("/hello", () => new Response("Hello World from POST"));
  router.put("/hello", () => new Response("Hello World from PUT"));
  router.delete("/hello", () => new Response("Hello World from DELETE"));

  server.use(router.middleware());

  await assertResponseSnapshot(
    t,
    server,
    new Request("http://localhost/hello"),
  );
  await assertResponseSnapshot(
    t,
    server,
    new Request("http://example.com/hello"),
  );
  await assertResponseSnapshot(
    t,
    server,
    new Request("http://localhost/hello", { method: "POST" }),
  );
  await assertResponseSnapshot(
    t,
    server,
    new Request("http://example.com:1234/hello", { method: "POST" }),
  );
  await assertResponseSnapshot(
    t,
    server,
    new Request("http://localhost/hello", { method: "PUT" }),
  );
  await assertResponseSnapshot(
    t,
    server,
    new Request("http://localhost/hello", { method: "DELETE" }),
  );
});

Deno.test("simple routes with base path", async (t) => {
  const server = getServer(() => new Response("Not Found", { status: 404 }));

  const router = new Router({
    basePath: "/api",
  });

  router.get("/hello", () => new Response("Hello World from GET"));

  server.use(router.middleware());

  await assertResponseSnapshot(
    t,
    server,
    new Request("http://localhost/hello"),
  );
  await assertResponseSnapshot(
    t,
    server,
    new Request("http://example.com/api/hello"),
  );
  await assertResponseSnapshot(
    t,
    server,
    new Request("http://example.com:1234/api/hello"),
  );
});

Deno.test("routes with parameters", async (t) => {
  const server = getServer(() => new Response("Not Found", { status: 404 }));

  const router = new Router();

  router.get("/hello/:name", ({ name }) => new Response(`Hello ${name}`));

  server.use(router.middleware());

  await assertResponseSnapshot(
    t,
    server,
    new Request("http://localhost/hello"),
  );
  await assertResponseSnapshot(
    t,
    server,
    new Request("http://localhost/hello/oscar"),
  );
  await assertResponseSnapshot(
    t,
    server,
    new Request("http://localhost/hello/oscar/"),
  );
});

Deno.test("routes with parameters and strict = false", async (t) => {
  const server = getServer(() => new Response("Not Found", { status: 404 }));

  const router = new Router({
    strict: false,
  });

  router.get(
    "/hello/:name",
    ({ name, request }) =>
      new Response(
        `Hello ${name} / ${new URL(request.url).searchParams.get("query")}`,
      ),
  );

  server.use(router.middleware());

  await assertResponseSnapshot(
    t,
    server,
    new Request("http://localhost/hello"),
  );
  await assertResponseSnapshot(
    t,
    server,
    new Request("http://localhost/hello/oscar"),
  );
  await assertResponseSnapshot(
    t,
    server,
    new Request("http://localhost/hello/oscar/"),
  );
  await assertResponseSnapshot(
    t,
    server,
    new Request("http://localhost/hello/oscar/?query=foo"),
  );
  await assertResponseSnapshot(
    t,
    server,
    new Request("http://localhost/hello/oscar?query=foo"),
  );
});
