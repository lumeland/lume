import { describe, it, expect } from "vitest";
import Scripts from "../src/scripts.ts";

describe("Scripts", async () => {
  const scripts = new Scripts();

  expect(scripts.scripts.size).toBe(0);

  it("Add a script", () => {
    scripts.set("script1", "script1-command");
    expect(scripts.scripts.size).toBe(1);
    expect(scripts.scripts.has("script1")).toBe(true);
    expect(scripts.scripts.get("script1")?.length).toBe(1);
    expect(scripts.scripts.get("script1")?.[0]).toBe("script1-command");

    scripts.set("script2", "script2-command-1", "script2-command-2");
    expect(scripts.scripts.size).toBe(2);
    expect(scripts.scripts.has("script2")).toBe(true);
    expect(scripts.scripts.get("script2")?.length).toBe(2);
    expect(scripts.scripts.get("script2")?.[0]).toBe("script2-command-1");
    expect(scripts.scripts.get("script2")?.[1]).toBe("script2-command-2");

    scripts.set("script3", ["script3-command-1", "script3-command-2"]);
    expect(scripts.scripts.size).toBe(3);
    expect(scripts.scripts.has("script3")).toBe(true);
    expect(scripts.scripts.get("script3")?.length).toBe(1);

    const script3 = scripts.scripts.get("script3")?.[0] as string[];
    expect(script3[0]).toBe("script3-command-1");
    expect(script3[1]).toBe("script3-command-2");
  });

  it("Add a function", async () => {
    scripts.set("my-fn", () => "foo");

    expect(scripts.scripts.size).toBe(4);
    const result = await scripts.run("my-fn");
    expect(result).toBe(true);
  });

  it("Add a false function", async () => {
    scripts.set("my-false-fn", () => false);

    expect(scripts.scripts.size).toBe(5);
    const result = await scripts.run("my-false-fn");
    expect(result).toBe(false);
  });
});
