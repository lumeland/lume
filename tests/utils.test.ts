import { assertEquals as equals } from "../deps/assert.ts";
import {
  documentToString,
  getDenoConfig,
  getImportMap,
  isPlainObject,
  merge,
  sha1,
  stringToDocument,
} from "../core/utils.ts";
import { getPath } from "./utils.ts";
import { React } from "../deps/react.ts";

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
  equals(isPlainObject([{ foo: "bar" }]), false);
  equals(isPlainObject(new Map()), false);
  equals(isPlainObject(new Set()), false);
  equals(isPlainObject(Symbol.for("foo")), false);
  equals(isPlainObject(new class {}()), false);
  equals(isPlainObject(new Object()), true);
  equals(isPlainObject(React.createElement("div")), false);
});

Deno.test("sha1 function", async () => {
  const data = "Hello World";
  const dataUint8 = new TextEncoder().encode(data);
  const expected = "\nMU��x�\x02/�p\x19w��@�Ć�";

  equals(await sha1(data), expected);
  equals(await sha1(dataUint8), expected);
});

Deno.test("load deno.jsonc", async () => {
  Deno.chdir(getPath("assets"));
  const config = await getDenoConfig();

  equals(config?.tasks, { foo: "echo bar" });
})

Deno.test("import map", async () => {
  const map = await getImportMap();

  equals(map, {
    imports: {
      "lume/": new URL("../", import.meta.url).href,
    },
  });
});

Deno.test("merge import map", async () => {
  const map = await getImportMap(getPath("assets/import_map.json"));

  equals(map, {
    imports: {
      "lume/": new URL("../", import.meta.url).href,
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

Deno.test("documentToString function should add doctype, if missing", () => {
  const documentWithoutDoctype = stringToDocument(
    `<html><head></head><body></body></html>`,
  );
  const documentWithDoctype = stringToDocument(
    `<!DOCTYPE html><html><head></head><body></body></html>`,
  );

  const expected = `<!DOCTYPE html>
<html><head></head><body></body></html>`;

  equals(documentToString(documentWithoutDoctype), expected);
  equals(documentToString(documentWithDoctype), expected);
});
