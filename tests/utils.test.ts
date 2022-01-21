import { assertEquals as equals } from "../deps/assert.ts";
import { getImportMap, isPlainObject, merge, sha1 } from "../core/utils.ts";

Deno.test("merge options", () => {
  interface Options {
    foo: string;
    foo2?: string;
  }

  const defaults: Options = {
    foo: "bar",
  };
  const user: Partial<Options> = {
    foo2: "bar2",
  };
  const expected: Options = {
    foo: "bar",
    foo2: "bar2",
  };

  equals(expected, merge(defaults, user));
});

Deno.test("merge inner options", () => {
  interface Options {
    foo: string;
    foo2: SubOptions;
  }

  interface SubOptions {
    bar1: string;
    bar2?: string;
    bar3?: string;
  }

  const defaults: Options = {
    foo: "bar",
    foo2: {
      bar1: "bar1",
      bar2: "bar2",
    },
  };
  const user: Partial<Options> = {
    foo: "new bar",
    foo2: {
      bar1: "new bar1",
      bar3: "bar3",
    },
  };
  const expected = {
    foo: "new bar",
    foo2: {
      bar1: "new bar1",
      bar2: "bar2",
      bar3: "bar3",
    },
  };

  equals(expected, merge(defaults, user));
});

Deno.test("isPlainObject", () => {
  equals(isPlainObject({}), true);
  equals(isPlainObject(new URL("http://localhost")), false);
  equals(isPlainObject([]), false);
  equals(isPlainObject(new Map()), false);
  equals(isPlainObject(new Set()), false);
  equals(isPlainObject(Symbol.for("foo")), false);
});

Deno.test("sha1 function", async () => {
  const data = "Hello World";
  const dataUint8 = new TextEncoder().encode(data);
  const expected = "\nMU��x�\x02/�p\x19w��@�Ć�";

  equals(await sha1(data), expected);
  equals(await sha1(dataUint8), expected);
});

Deno.test("import map", () => {
  const map = getImportMap();

  equals(map.imports["lume"], new URL("../mod.ts", import.meta.url).href);
  equals(map.imports["lume/"], new URL("../", import.meta.url).href);
  equals(map.imports["lume/"], new URL("../", import.meta.url).href);

  equals(map, {
    imports: {
      "lume": new URL("../mod.ts", import.meta.url).href,
      "lume/": new URL("../", import.meta.url).href,
      "https://deno.land/x/lume/": new URL("../", import.meta.url).href,
    },
  });
});

Deno.test("merge import map", async () => {
  const map = await getImportMap({
    imports: {
      "lume": "https://lume.land/lume.ts",
      "std/": "https://deno.land/std@0.121.0/",
      "/": "./",
    },
    scopes: {
      "foo/": {
        "std/": "https://deno.land/std@0.121.0/foo/",
        "/": "./foo/",
      },
    },
  });

  equals(map, {
    imports: {
      "lume": "https://lume.land/lume.ts",
      "lume/": new URL("../", import.meta.url).href,
      "https://deno.land/x/lume/": new URL("../", import.meta.url).href,
      "std/": "https://deno.land/std@0.121.0/",
      "/": "./",
    },
    scopes: {
      "foo/": {
        "std/": "https://deno.land/std@0.121.0/foo/",
        "/": "./foo/",
      },
    },
  });
});
Deno.test("merge and resolve import map", async () => {
  const path = new URL("./assets/import_map.json", import.meta.url);
  const map = await getImportMap({
    imports: {
      "lume": "https://lume.land/lume.ts",
      "std/": "https://deno.land/std@0.121.0/",
      "/": "./",
    },
    scopes: {
      "foo/": {
        "std/": "https://deno.land/std@0.121.0/foo/",
        "/": "./foo/",
      },
    },
  }, path);

  equals(map, {
    imports: {
      "lume": "https://lume.land/lume.ts",
      "lume/": new URL("../", import.meta.url).href,
      "https://deno.land/x/lume/": new URL("../", import.meta.url).href,
      "std/": "https://deno.land/std@0.121.0/",
      "/": new URL("./assets/", import.meta.url).href,
    },
    scopes: {
      "foo/": {
        "std/": "https://deno.land/std@0.121.0/foo/",
        "/": new URL("./assets/foo/", import.meta.url).href,
      },
    },
  });
});
