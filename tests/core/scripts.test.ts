import { assertStrictEquals as equals } from "../../deps/assert.ts";
import Scripts from "../../core/scripts.ts";

Deno.test("Scripts", async (t) => {
  const scripts = new Scripts();

  equals(scripts.scripts.size, 0);

  await t.step("Add a script", () => {
    scripts.set("script1", "script1-command");
    equals(scripts.scripts.size, 1);
    equals(scripts.scripts.has("script1"), true);
    equals(scripts.scripts.get("script1")?.length, 1);
    equals(scripts.scripts.get("script1")?.[0], "script1-command");

    scripts.set("script2", "script2-command-1", "script2-command-2");
    equals(scripts.scripts.size, 2);
    equals(scripts.scripts.has("script2"), true);
    equals(scripts.scripts.get("script2")?.length, 2);
    equals(scripts.scripts.get("script2")?.[0], "script2-command-1");
    equals(scripts.scripts.get("script2")?.[1], "script2-command-2");

    scripts.set("script3", ["script3-command-1", "script3-command-2"]);
    equals(scripts.scripts.size, 3);
    equals(scripts.scripts.has("script3"), true);
    equals(scripts.scripts.get("script3")?.length, 1);

    const script3 = scripts.scripts.get("script3")?.[0] as string[];
    equals(script3[0], "script3-command-1");
    equals(script3[1], "script3-command-2");
  });

  await t.step("Add a function", async () => {
    scripts.set("my-fn", () => "foo");

    equals(scripts.scripts.size, 4);
    const result = await scripts.run("my-fn");
    equals(result, true);
  });

  await t.step("Add a false function", async () => {
    scripts.set("my-false-fn", () => false);

    equals(scripts.scripts.size, 5);
    const result = await scripts.run("my-false-fn");
    equals(result, false);
  });
});
