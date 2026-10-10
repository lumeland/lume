import { describe, it, expect } from "vitest";
import Events from "../src/events.ts";

describe("Events", async () => {
  const events = new Events();
  const called = {
    beforeBuild: 0,
    afterBuild: 0,
    afterRender: 0,
    beforeSave: 0,
    beforeUpdate: 0,
  };

  expect(events.listeners.size).toBe(0);

  it("Add events", () => {
    events.addEventListener("beforeBuild", () => called.beforeBuild++);
    expect(events.listeners.size).toBe(1);

    events.addEventListener("afterBuild", () => called.afterBuild++);
    expect(events.listeners.size).toBe(2);
  });

  it("Dispatch events", async () => {
    await events.dispatchEvent({ type: "afterBuild" });
    expect(called.beforeBuild).toBe(0);
    expect(called.afterBuild).toBe(1);

    await events.dispatchEvent({ type: "beforeBuild" });
    expect(called.beforeBuild).toBe(1);
    expect(called.afterBuild).toBe(1);
  });

  it("Once events", async () => {
    events.addEventListener("afterRender", () => called.afterRender++, {
      once: true,
    });

    await events.dispatchEvent({ type: "afterRender" });
    expect(called.afterRender).toBe(1);

    await events.dispatchEvent({ type: "afterRender" });
    expect(called.afterRender).toBe(1);
  });

  it("Signal events", async () => {
    const controller = new AbortController();

    events.addEventListener("beforeSave", () => called.beforeSave++, {
      signal: controller.signal,
    });

    await events.dispatchEvent({ type: "beforeSave" });
    expect(called.beforeSave).toBe(1);

    await events.dispatchEvent({ type: "beforeSave" });
    expect(called.beforeSave).toBe(2);

    controller.abort();

    await events.dispatchEvent({ type: "beforeSave" });
    expect(called.beforeSave).toBe(2);
  });

  it("Return false", async () => {
    events.addEventListener("beforeUpdate", () => called.beforeUpdate++);
    events.addEventListener("beforeUpdate", () => true);
    events.addEventListener("beforeUpdate", () => called.beforeUpdate++);

    expect(events.listeners.get("beforeUpdate")?.size).toBe(3);
    await events.dispatchEvent({ type: "beforeUpdate" });
    expect(called.beforeUpdate).toBe(2);

    events.addEventListener("beforeUpdate", () => called.beforeUpdate++);
    events.addEventListener("beforeUpdate", () => false);
    events.addEventListener("beforeUpdate", () => called.beforeUpdate++);

    await events.dispatchEvent({ type: "beforeUpdate" });
    expect(called.beforeUpdate).toBe(5);
  });
});
