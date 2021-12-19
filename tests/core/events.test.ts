import { assertStrictEquals as equals } from "../../deps/assert.ts";
import Events from "../../core/events.ts";

Deno.test("Events", async (t) => {
  const events = new Events();
  const called = {
    beforeBuild: 0,
    afterBuild: 0,
    afterRender: 0,
    beforeSave: 0,
    beforeUpdate: 0,
  };

  equals(events.listeners.size, 0);

  await t.step("Add events", () => {
    events.addEventListener("beforeBuild", () => called.beforeBuild++);
    equals(events.listeners.size, 1);

    events.addEventListener("afterBuild", () => called.afterBuild++);
    equals(events.listeners.size, 2);
  });

  await t.step("Dispatch events", async () => {
    await events.dispatchEvent({ type: "afterBuild" });
    equals(called.beforeBuild, 0);
    equals(called.afterBuild, 1);

    await events.dispatchEvent({ type: "beforeBuild" });
    equals(called.beforeBuild, 1);
    equals(called.afterBuild, 1);
  });

  await t.step("Once events", async () => {
    events.addEventListener("afterRender", () => called.afterRender++, {
      once: true,
    });

    await events.dispatchEvent({ type: "afterRender" });
    equals(called.afterRender, 1);

    await events.dispatchEvent({ type: "afterRender" });
    equals(called.afterRender, 1);
  });

  await t.step("Signal events", async () => {
    const controller = new AbortController();

    events.addEventListener("beforeSave", () => called.beforeSave++, {
      signal: controller.signal,
    });

    await events.dispatchEvent({ type: "beforeSave" });
    equals(called.beforeSave, 1);

    await events.dispatchEvent({ type: "beforeSave" });
    equals(called.beforeSave, 2);

    controller.abort();

    await events.dispatchEvent({ type: "beforeSave" });
    equals(called.beforeSave, 2);
  });

  await t.step("Return false", async () => {
    events.addEventListener("beforeUpdate", () => called.beforeUpdate++);
    events.addEventListener("beforeUpdate", () => true);
    events.addEventListener("beforeUpdate", () => called.beforeUpdate++);

    equals(events.listeners.get("beforeUpdate")?.size, 3);
    await events.dispatchEvent({ type: "beforeUpdate" });
    equals(called.beforeUpdate, 2);

    events.addEventListener("beforeUpdate", () => called.beforeUpdate++);
    events.addEventListener("beforeUpdate", () => false);
    events.addEventListener("beforeUpdate", () => called.beforeUpdate++);

    await events.dispatchEvent({ type: "beforeUpdate" });
    equals(called.beforeUpdate, 5);
  });
});
