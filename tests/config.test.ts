import { assertStrictEquals as equals } from "../deps/assert.ts";
import lume from "../mod.ts";
import LumeSite from "../core/site.ts";
import LumeSource from "../core/source.ts";
import LumeRenderer from "../core/renderer.ts";
import LumeScripts from "../core/scripts.ts";

Deno.test("default configuration", () => {
  const site = lume();
  const { options } = site;

  equals(options.cwd, Deno.cwd());
  equals(options.src, "./");
  equals(options.dest, "./_site");
  equals(options.location.href, "http://localhost/");
  equals(options.dev, false);
  equals(options.prettyUrls, true);
  equals(options.server.port, 3000);
  equals(options.server.page404, "/404.html");
  equals(options.server.open, false);
});

Deno.test("static files configuration", () => {
  const site = lume();
  const { staticFiles } = site.source as LumeSource;

  site.copy("img");
  equals(staticFiles.size, 1);
  equals(staticFiles.has("/img"), true);
  equals(staticFiles.get("/img"), "/img");

  site.copy("statics/favicon.ico", "favicon.ico");
  equals(staticFiles.size, 2);
  equals(staticFiles.get("/statics/favicon.ico"), "/favicon.ico");

  site.copy("css", ".");
  equals(staticFiles.size, 3);
  equals(staticFiles.get("/css"), "/");
});

Deno.test("ignored files configuration", () => {
  const site = lume();
  const { ignored } = site.source as LumeSource;

  equals(ignored.size, 2);
  equals(ignored.has("/node_modules"), true);
  equals(ignored.has("/_site"), true);

  site.ignore("README.md");
  equals(ignored.size, 3);
  equals(ignored.has("/README.md"), true);

  site.ignore("file2", "file3", "README.md");
  equals(ignored.size, 5);
  equals(ignored.has("/file2"), true);
  equals(ignored.has("/file3"), true);

  site.copy("img");
  site.copy("statics", ".");
  equals(ignored.size, 7);
  equals(ignored.has("/img"), true);
  equals(ignored.has("/statics"), true);
});

Deno.test("event listener configuration", () => {
  const site = lume();
  const { listeners } = site as LumeSite;

  equals(listeners.size, 2);
  equals(listeners.has("beforeBuild"), true);
  equals(listeners.has("beforeUpdate"), true);
  equals(listeners.get("beforeBuild")?.size, 1);
  equals(listeners.get("beforeUpdate")?.size, 4);

  site.addEventListener("afterBuild", "afterbuild-command");
  equals(listeners.get("afterBuild")?.size, 1);
  const listenersList = Array.from(listeners.get("afterBuild")!);
  equals(listenersList[0][0], "afterbuild-command");
});

Deno.test("script configuration", () => {
  const site = lume();
  const { scripts } = site.scripts as LumeScripts;

  equals(scripts.size, 0);

  site.script("script1", "script1-command");
  equals(scripts.size, 1);
  equals(scripts.has("script1"), true);
  equals(scripts.get("script1")?.length, 1);
  equals(scripts.get("script1")?.[0], "script1-command");

  site.script("script2", "script2-command-1", "script2-command-2");
  equals(scripts.size, 2);
  equals(scripts.has("script2"), true);
  equals(scripts.get("script2")?.length, 2);
  equals(scripts.get("script2")?.[0], "script2-command-1");
  equals(scripts.get("script2")?.[1], "script2-command-2");

  site.script("script3", ["script3-command-1", "script3-command-2"]);
  equals(scripts.size, 3);
  equals(scripts.has("script3"), true);
  equals(scripts.get("script3")?.length, 1);

  const script3 = scripts.get("script3")?.[0] as string[];
  equals(script3[0], "script3-command-1");
  equals(script3[1], "script3-command-2");
});

Deno.test("data configuration", () => {
  const site = lume();
  const { dataLoaders } = site.source as LumeSource;

  equals(dataLoaders.size, 5);
  equals(dataLoaders.has(".json"), true);
  equals(dataLoaders.has(".js"), true);
  equals(dataLoaders.has(".ts"), true);
  equals(dataLoaders.has(".yaml"), true);
  equals(dataLoaders.has(".yml"), true);

  const loader = () => Promise.resolve({});
  site.loadData([".ext1", ".ext2"], loader);
  equals(dataLoaders.size, 7);
  equals(dataLoaders.get(".ext1"), loader);
  equals(dataLoaders.get(".ext2"), loader);
});

Deno.test("pages configuration", () => {
  const site = lume();
  const { engines } = site.renderer as LumeRenderer;
  const { pageLoaders } = site.source as LumeSource;

  equals(pageLoaders.size, 7);
  equals(pageLoaders.has(".tmpl.json"), true);
  equals(pageLoaders.has(".tmpl.js"), true);
  equals(pageLoaders.has(".tmpl.ts"), true);
  equals(pageLoaders.has(".md"), true);
  equals(pageLoaders.has(".njk"), true);
  equals(pageLoaders.has(".yaml"), true);
  equals(pageLoaders.has(".yml"), true);

  equals(engines.size, 4);
  equals(engines.has(".tmpl.js"), true);
  equals(engines.has(".tmpl.ts"), true);
  equals(engines.has(".md"), true);
  equals(engines.has(".njk"), true);

  const loader = () => Promise.resolve({});
  const engine = {
    render: () => {},
    addHelper: () => {},
  };

  site.loadPages([".ext1", ".ext2"], loader, engine);
  equals(pageLoaders.size, 9);
  equals(pageLoaders.get(".ext1"), loader);
  equals(pageLoaders.get(".ext2"), loader);

  equals(engines.size, 6);
  equals(engines.get(".ext1"), engine);
  equals(engines.get(".ext2"), engine);
});

Deno.test("assets configuration", () => {
  const site = lume();
  const { pageLoaders, assets } = site.source as LumeSource;

  equals(pageLoaders.size, 7);
  equals(assets.size, 0);

  const loader = () => Promise.resolve({});
  site.loadAssets([".css", ".js"], loader);

  equals(pageLoaders.size, 9);
  equals(assets.size, 2);
  equals(pageLoaders.get(".css"), loader);
  equals(pageLoaders.get(".js"), loader);
  equals(assets.has(".css"), true);
  equals(assets.has(".js"), true);
});

Deno.test("preprocessor configuration", () => {
  const site = lume();
  const { preprocessors } = site.renderer as LumeRenderer;

  equals(preprocessors.size, 0);

  const processor = () => Promise.resolve({});
  const ext1 = [".ext1"];

  site.preprocess(ext1, processor);
  equals(preprocessors.size, 1);
  equals(preprocessors.has(processor), true);
  equals(preprocessors.get(processor), ext1);

  const ext2 = [".ext2"];
  site.preprocess(ext2, processor);
  equals(preprocessors.size, 1);
  equals(preprocessors.has(processor), true);
  equals(preprocessors.get(processor), ext2);

  const processor2 = () => Promise.resolve({});
  site.preprocess(ext2, processor2);
  equals(preprocessors.size, 2);
  equals(preprocessors.has(processor2), true);
  equals(preprocessors.get(processor2), ext2);
});

Deno.test("processor configuration", () => {
  const site = lume();
  const { processors } = site.renderer as LumeRenderer;

  equals(processors.size, 0);

  const processor = () => Promise.resolve({});
  const ext1 = [".ext1"];

  site.process(ext1, processor);
  equals(processors.size, 1);
  equals(processors.has(processor), true);
  equals(processors.get(processor), ext1);

  const ext2 = [".ext2"];
  site.process(ext2, processor);
  equals(processors.size, 1);
  equals(processors.has(processor), true);
  equals(processors.get(processor), ext2);

  const processor2 = () => Promise.resolve({});
  site.process(ext2, processor2);
  equals(processors.size, 2);
  equals(processors.has(processor2), true);
  equals(processors.get(processor2), ext2);
});

Deno.test("helpers configuration", () => {
  const site = lume();
  const { helpers } = site.renderer as LumeRenderer;

  equals(helpers.size, 4);
  equals(helpers.has("url"), true);
  equals(helpers.has("htmlUrl"), true);
  equals(helpers.has("md"), true);
  equals(helpers.has("njk"), true);

  const helper = () => {};
  const options = { type: "filter" };

  site.helper("helper1", helper, options);
  equals(helpers.size, 5);
  equals(helpers.has("helper1"), true);
  equals(helpers.get("helper1")![0], helper);
  equals(helpers.get("helper1")![1], options);

  const filter = () => {};
  site.filter("filter1", filter, true);
  equals(helpers.size, 6);
  equals(helpers.has("filter1"), true);
  equals(helpers.get("filter1")![0], filter);
  equals(helpers.get("filter1")![1].type, "filter");
  equals(helpers.get("filter1")![1].async, true);
});

Deno.test("extra data", () => {
  const site = lume();
  const { extraData } = site.renderer as LumeRenderer;

  equals(Object.keys(extraData).length, 2);
  equals(Object.keys(extraData)[0], "paginate");
  equals(Object.keys(extraData)[1], "search");

  site.data("name", "lume");
  equals(Object.keys(extraData).length, 3);
  equals(extraData.name, "lume");
});

Deno.test("url location", () => {
  const site = lume({
    location: new URL("https://example.com/subfolder/"),
  });

  equals(site.options.location.href, "https://example.com/subfolder/");
  equals(site.url("/"), "/subfolder/");
  equals(site.url("foo"), "/subfolder/foo");
  equals(site.url("foo/../bar"), "/subfolder/bar");
  equals(site.url("/subfolder/styles.css"), "/subfolder/styles.css");
  equals(site.url("./foo"), "./foo");
  equals(site.url("../foo"), "../foo");
  equals(site.url("?foo=bar"), "?foo=bar");
  equals(site.url("#foo"), "#foo");
  equals(site.url("http://domain.com"), "http://domain.com/");

  // Absolute urls
  equals(site.url("/", true), "https://example.com/subfolder/");
  equals(site.url("foo", true), "https://example.com/subfolder/foo");
  equals(site.url("foo/../bar", true), "https://example.com/subfolder/bar");
  equals(
    site.url("/subfolder/styles.css", true),
    "https://example.com/subfolder/styles.css",
  );
  equals(site.url("./foo", true), "./foo");
  equals(site.url("../foo", true), "../foo");
  equals(site.url("?foo=bar", true), "?foo=bar");
  equals(site.url("#foo", true), "#foo");
  equals(site.url("http://domain.com", true), "http://domain.com/");
});

Deno.test("src/dest paths", () => {
  const site = lume({
    cwd: "/projects/my-website",
    src: "src-files",
    dest: "dist",
  });

  equals(site.options.cwd, "/projects/my-website");
  equals(site.options.src, "src-files");
  equals(site.options.dest, "dist");

  equals(site.src(), "/projects/my-website/src-files");
  equals(site.src("."), "/projects/my-website/src-files");
  equals(site.src("/"), "/projects/my-website/src-files/");
  equals(site.src("pages/posts"), "/projects/my-website/src-files/pages/posts");

  equals(site.dest(), "/projects/my-website/dist");
  equals(site.dest("."), "/projects/my-website/dist");
  equals(site.dest("/"), "/projects/my-website/dist/");
  equals(site.dest("pages/posts"), "/projects/my-website/dist/pages/posts");
});
