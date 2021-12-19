import {
  assert,
  assertEquals,
  assertStrictEquals as equals,
} from "../../deps/assert.ts";
import Reader from "../../core/reader.ts";
import IncludesLoader from "../../core/includes_loader.ts";
import PageLoader from "../../core/page_loader.ts";
import AssetLoader from "../../core/asset_loader.ts";
import DataLoader from "../../core/data_loader.ts";
import yamlLoader from "../../core/loaders/yaml.ts";
import moduleLoader from "../../core/loaders/module.ts";
import jsonLoader from "../../core/loaders/json.ts";
import textLoader from "../../core/loaders/text.ts";

Deno.test("Loaders", async (t) => {
  const src = new URL("./loaders_assets", import.meta.url).pathname;
  const reader = new Reader({ src });
  const includesLoader = new IncludesLoader({ reader, includes: "/" });
  const pageLoader = new PageLoader({ reader });
  const assetLoader = new AssetLoader({ reader });
  const dataLoader = new DataLoader({ reader });

  equals(includesLoader.loaders.entries.length, 0);
  equals(includesLoader.paths.entries.length, 0);
  equals(pageLoader.loaders.entries.length, 0);
  equals(assetLoader.loaders.entries.length, 0);
  equals(dataLoader.loaders.entries.length, 0);

  dataLoader.set([".yml"], yamlLoader);
  dataLoader.set([".ts"], moduleLoader);
  dataLoader.set([".json"], jsonLoader);
  dataLoader.set([".txt"], textLoader);
  equals(dataLoader.loaders.entries.length, 4);

  await t.step("Data loader", async () => {
    const yaml = await dataLoader.load("data.yml");
    assert(yaml);
    equals(yaml.title, "Hello world");
    assertEquals(yaml.tags, ["tag1", "tag2"]);

    const module = await dataLoader.load("data.ts");
    assert(module);
    equals(module.title, "Title from default");
    equals(module.subtitle, "Subtitle value");
    assertEquals(module.tags, ["tag1"]);

    const json = await dataLoader.load("data.json");
    assert(json);
    equals(json.title, "Title from json");
    assertEquals(json.tags, ["tag1", "tag2"]);

    const text = await dataLoader.load("data.txt");
    assert(text);
    equals(text.title, "Title in the front matter");
    equals(text.content, "Hello world");
    assertEquals(text.tags, ["tag1"]);

    const dir = await dataLoader.load("_data");
    assert(dir);
    assertEquals(dir, {
      value1: { name: "Value1" },
      value2: { name: "Value2" },
      value3: {
        subvalue: { name: "Subvalue3" },
      },
    });
  });

  includesLoader.set([".yml"], yamlLoader);
  includesLoader.set([".ts"], moduleLoader);
  includesLoader.set([".json"], jsonLoader);
  includesLoader.set([".txt"], textLoader);
  equals(includesLoader.loaders.entries.length, 4);

  await t.step("Includes loader", async () => {
    const yaml = await includesLoader.load("data.yml");
    assert(yaml);
    equals(yaml[0], "/data.yml");
    equals(yaml[1].title, "Hello world");

    const module = await includesLoader.load("data.ts");
    assert(module);
    equals(module[0], "/data.ts");
    equals(module[1]?.title, "Title from default");
    equals(module[1]?.subtitle, "Subtitle value");

    const json = await includesLoader.load("data.json");
    assert(json);
    equals(json[0], "/data.json");
    equals(json[1].title, "Title from json");

    const text = await includesLoader.load("data.txt");
    assert(text);
    equals(text[0], "/data.txt");
    equals(text[1].title, "Title in the front matter");
  });

  pageLoader.set([".yml"], yamlLoader);
  pageLoader.set([".ts"], moduleLoader);
  pageLoader.set([".json"], jsonLoader);
  pageLoader.set([".txt"], textLoader);
  equals(pageLoader.loaders.entries.length, 4);

  await t.step("Page loader", async () => {
    const yaml = await pageLoader.load("data.yml");
    assert(yaml);
    equals(yaml.data.title, "Hello world");
    assertEquals(yaml.data.tags, ["tag1", "tag2"]);
    assert(yaml.data.date instanceof Date);
    equals(yaml.src.path, "/data");
    equals(yaml.src.ext, ".yml");
    equals(yaml.dest.path, "/data");
    equals(yaml.dest.ext, "");

    const module = await pageLoader.load("data.ts");
    assert(module);
    equals(module.data.title, "Title from default");
    equals(module.data.subtitle, "Subtitle value");
    assertEquals(module.data.tags, ["tag1"]);
    assert(module.data.date instanceof Date);
    equals(module.src.path, "/data");
    equals(module.src.ext, ".ts");
    equals(module.dest.path, "/data");
    equals(module.dest.ext, "");

    const json = await pageLoader.load("data.json");
    assert(json);
    equals(json.data.title, "Title from json");
    assertEquals(json.data.tags, ["tag1", "tag2"]);
    assert(json.data.date instanceof Date);
    equals(json.src.path, "/data");
    equals(json.src.ext, ".json");
    equals(json.dest.path, "/data");
    equals(json.dest.ext, "");

    const text = await pageLoader.load("data.txt");
    assert(text);
    equals(text.data.title, "Title in the front matter");
    equals(text.data.content, "Hello world");
    assertEquals(text.data.tags, ["tag1"]);
    assert(text.data.date instanceof Date);
    equals(text.src.path, "/data");
    equals(text.src.ext, ".txt");
    equals(text.dest.path, "/data");
    equals(text.dest.ext, "");
  });

  await t.step("Page data detection", async () => {
    const page1 = await pageLoader.load("page.txt");
    assert(page1);
    assert(page1.data.date instanceof Date);
    equals(page1.data.date.getUTCDate(), 21);
    equals(page1.data.date.getUTCMonth(), 4);
    equals(page1.data.date.getUTCFullYear(), 2022);
    equals(page1.data.date.getUTCHours(), 0);
    equals(page1.data.date.getUTCMinutes(), 0);
    equals(page1.data.date.getUTCSeconds(), 0);

    const page2 = await pageLoader.load("1_page.txt");
    assert(page2);
    assert(page2.data.date instanceof Date);
    equals(page2.data.date.getUTCDate(), 1);
    equals(page2.data.date.getUTCMonth(), 0);
    equals(page2.data.date.getUTCFullYear(), 1970);
    equals(page2.data.date.getUTCHours(), 0);
    equals(page2.data.date.getUTCMinutes(), 0);
    equals(page2.data.date.getUTCSeconds(), 0);

    const page3 = await pageLoader.load("2021-12-19_page.txt");
    assert(page3);
    assert(page3.data.date instanceof Date);
    equals(page3.data.date.getUTCDate(), 19);
    equals(page3.data.date.getUTCMonth(), 11);
    equals(page3.data.date.getUTCFullYear(), 2021);
    equals(page3.data.date.getUTCHours(), 0);
    equals(page3.data.date.getUTCMinutes(), 0);
    equals(page3.data.date.getUTCSeconds(), 0);

    const page4 = await pageLoader.load("2021-12-19-20-35_page.txt");
    assert(page4);
    assert(page4.data.date instanceof Date);
    equals(page4.data.date.getUTCDate(), 19);
    equals(page4.data.date.getUTCMonth(), 11);
    equals(page4.data.date.getUTCFullYear(), 2021);
    equals(page4.data.date.getUTCHours(), 20);
    equals(page4.data.date.getUTCMinutes(), 35);
    equals(page4.data.date.getUTCSeconds(), 0);
  });

  assetLoader.set([".yml"], yamlLoader);
  assetLoader.set([".ts"], moduleLoader);
  assetLoader.set([".json"], jsonLoader);
  assetLoader.set([".txt"], textLoader);
  equals(assetLoader.loaders.entries.length, 4);

  await t.step("Asset loader", async () => {
    const yaml = await assetLoader.load("data.yml");
    assert(yaml);
    equals(yaml.data.title, "Hello world");
    assertEquals(yaml.data.tags, ["tag1", "tag2"]);
    assert(yaml.data.date instanceof Date);
    equals(yaml.src.path, "/data");
    equals(yaml.src.ext, ".yml");
    equals(yaml.dest.path, "/data");
    equals(yaml.dest.ext, ".yml");

    const module = await assetLoader.load("data.ts");
    assert(module);
    equals(module.data.title, "Title from default");
    equals(module.data.subtitle, "Subtitle value");
    assertEquals(module.data.tags, ["tag1"]);
    assert(module.data.date instanceof Date);
    equals(module.src.path, "/data");
    equals(module.src.ext, ".ts");
    equals(module.dest.path, "/data");
    equals(module.dest.ext, ".ts");

    const json = await assetLoader.load("data.json");
    assert(json);
    equals(json.data.title, "Title from json");
    assertEquals(json.data.tags, ["tag1", "tag2"]);
    assert(json.data.date instanceof Date);
    equals(json.src.path, "/data");
    equals(json.src.ext, ".json");
    equals(json.dest.path, "/data");
    equals(json.dest.ext, ".json");

    const text = await assetLoader.load("data.txt");
    assert(text);
    equals(text.data.title, "Title in the front matter");
    equals(text.data.content, "Hello world");
    assertEquals(text.data.tags, ["tag1"]);
    assert(text.data.date instanceof Date);
    equals(text.src.path, "/data");
    equals(text.src.ext, ".txt");
    equals(text.dest.path, "/data");
    equals(text.dest.ext, ".txt");
  });
});
