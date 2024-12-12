import { assertResponseSnapshot, getServer } from "./utils.ts";
import noCors from "../middlewares/no_cors.ts";

Deno.test("no_cors middleware", async (t) => {
  const server = getServer();

  server.use(noCors());

  await assertResponseSnapshot(t, server);
});
