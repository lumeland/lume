import { assertEquals as equals } from "../../deps/assert.ts";
import Processors from "../../core/processors.ts";
import { Page } from "../../core/file.ts";

Deno.test("Processors", async (t) => {
  const processors = new Processors();

  equals(processors.processors.size, 0);

  await t.step("Add processors", () => {
    const ext = [".foo"];
    const fn = (page: Page) => {
      const content = page.content as string;
      page.content = content.toUpperCase();
    };

    processors.set(ext, fn, false);

    equals(processors.processors.size, 1);
    const entry = Array.from(processors.processors)[0];
    equals(entry[0], fn);
    equals(entry[1], { extensions: ext, multiple: false });

    const asterisk = (page: Page) => {
      const content = page.content as string;
      page.content = content + "*";
    };

    processors.set("*", asterisk, false);

    equals(processors.processors.size, 2);
  });

  await t.step({
    name: "Run processors",
    ignore: true,
    fn: async () => {
      const page1 = new Page({
        path: "file1",
        ext: ".foo",
      });
      page1.content = "content page 1";

      const page2 = new Page({
        path: "file2",
        ext: ".bar",
      });
      page2.content = "content page 2";

      const page3 = new Page({
        path: "file2",
        ext: ".bar",
      });
      page3.data.url = "file2.foo";
      page3.content = "content page 3";

      const pages = [page1, page2, page3];
      await processors.run(pages);

      equals(page1.content, "CONTENT PAGE 1*");
      equals(page2.content, "content page 2*");
      equals(page3.content, "CONTENT PAGE 3*");
    },
  });
});
