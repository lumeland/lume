import { assertStrictEquals as equals } from "../deps/assert.ts";
import { getSite } from "./utils.ts";

Deno.test("build events global events", async () => {
  const site = getSite(
    {
      src: "empty",
    },
    {},
  );

  let times = 0;
  let once = 0;
  let aborted = 0;

  const controller = new AbortController();

  addEventListener("lume:afterBuild", () => {
    times++;
  });
  addEventListener("lume:afterBuild", () => {
    once++;
  }, { once: true });
  addEventListener("lume:afterBuild", () => {
    aborted++;
  }, {
    signal: controller.signal,
  });

  await site.build();

  equals(times, 1);
  equals(once, 1);
  equals(aborted, 1);

  await site.build();

  equals(times, 2);
  equals(once, 1);
  equals(aborted, 2);

  controller.abort();
  await site.build();

  equals(times, 3);
  equals(once, 1);
  equals(aborted, 2);
});

Deno.test("build events", async () => {
  const site = getSite(
    {
      src: "empty",
    },
    {},
  );

  let times = 0;
  let once = 0;
  let aborted = 0;

  const controller = new AbortController();

  site.addEventListener("afterBuild", () => times++);
  site.addEventListener("afterBuild", () => once++, { once: true });
  site.addEventListener("afterBuild", () => aborted++, {
    signal: controller.signal,
  });

  await site.build();

  equals(times, 1);
  equals(once, 1);
  equals(aborted, 1);

  await site.build();

  equals(times, 2);
  equals(once, 1);
  equals(aborted, 2);

  controller.abort();
  await site.build();

  equals(times, 3);
  equals(once, 1);
  equals(aborted, 2);
});
