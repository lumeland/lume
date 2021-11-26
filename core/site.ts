import { join, posix, SEP } from "../deps/path.ts";
import SiteSource from "./source.ts";
import ScriptRunner from "./scripts.ts";
import PerformanceMetrics from "./metrics.ts";
import SiteRenderer from "./renderer.ts";
import SiteEmitter from "./emitter.ts";
import textLoader from "./loaders/text.ts";
import {
  Command,
  CommandOptions,
  Emitter,
  Engine,
  Event,
  EventListener,
  EventOptions,
  EventType,
  Helper,
  HelperOptions,
  Loader,
  Metrics,
  Page,
  Plugin,
  Processor,
  Renderer,
  ScopeFilter,
  Scripts,
  Site,
  SiteOptions,
  Source,
} from "../core.ts";
import { concurrent, Exception, merge, normalizePath } from "./utils.ts";
import Changes from "./changes.ts";

const defaults: SiteOptions = {
  cwd: Deno.cwd(),
  src: "./",
  dest: "./_site",
  includes: "_includes",
  location: new URL("http://localhost"),
  metrics: false,
  quiet: false,
  dev: false,
  prettyUrls: true,
  server: {
    port: 3000,
    open: false,
    page404: "/404.html",
  },
  watcher: {
    ignore: [],
    debounce: 100,
  },
};

type Listener = [EventListener | string, EventOptions | undefined];

/**
 * The default site builder
 */
export default class LumeSite implements Site {
  options: SiteOptions;
  source: Source;
  scripts: Scripts;
  metrics: Metrics;
  renderer: Renderer;
  emitter: Emitter;
  pages: Page[] = [];
  listeners = new Map<EventType, Set<Listener>>();
  #scopes = new Set<ScopeFilter>();

  constructor(options: Partial<SiteOptions> = {}) {
    this.options = merge(defaults, options);
    this.source = new SiteSource(this);
    this.scripts = new ScriptRunner(this);
    this.metrics = new PerformanceMetrics(this);
    this.renderer = new SiteRenderer(this);
    this.emitter = new SiteEmitter(this);

    // Ignore the dest directory if it's inside src
    if (this.dest().startsWith(this.src())) {
      this.ignore(this.options.dest);
    }

    // Ignore the dest folder by the watcher
    this.options.watcher.ignore.push(this.dest());
  }

  src(...path: string[]) {
    return join(this.options.cwd, this.options.src, ...path);
  }

  dest(...path: string[]) {
    return join(this.options.cwd, this.options.dest, ...path);
  }

  addEventListener(
    type: EventType,
    listenerFn: EventListener | string,
    options?: EventOptions,
  ) {
    const listeners = this.listeners.get(type) || new Set();
    const listener: Listener = [
      listenerFn,
      options,
    ];
    listeners.add(listener);
    this.listeners.set(type, listeners);

    // Remove on abort
    if (options?.signal) {
      options.signal.addEventListener("abort", () => {
        listeners.delete(listener);
      });
    }

    return this;
  }

  async dispatchEvent(event: Event) {
    const type = event.type;
    const listeners = this.listeners.get(type);

    if (!listeners) {
      return true;
    }

    for (const listener of listeners) {
      const [listenerFn, listenerOptions] = listener;

      // Remove the listener if it's a once listener
      if (listenerOptions?.once) {
        listeners.delete(listener);
      }

      if (typeof listenerFn === "string") {
        const success = await this.run(listenerFn);

        if (!success) {
          return false;
        }

        continue;
      }

      if (await listenerFn(event) === false) {
        return false;
      }
    }
    return true;
  }

  use(plugin: Plugin) {
    plugin(this);
    return this;
  }

  script(name: string, ...scripts: Command[]) {
    this.scripts.add(name, ...scripts);
    return this;
  }

  loadData(extensions: string[], loader: Loader) {
    this.source.addDataLoader(extensions, loader);
    return this;
  }

  loadPages(extensions: string[], loader?: Loader, engine?: Engine) {
    this.source.addPageLoader(extensions, loader || textLoader, false);

    if (engine) {
      this.renderer.addEngine(extensions, engine);
    }

    return this;
  }

  loadAssets(extensions: string[], loader?: Loader) {
    this.source.addPageLoader(extensions, loader || textLoader, true);
    return this;
  }

  preprocess(extensions: string[], preprocessor: Processor) {
    this.renderer.addPreprocessor(extensions, preprocessor);
    return this;
  }

  process(extensions: string[], processor: Processor) {
    this.renderer.addProcessor(extensions, processor);
    return this;
  }

  filter(name: string, filter: Helper, async = false) {
    return this.helper(name, filter, { type: "filter", async });
  }

  helper(name: string, fn: Helper, options: HelperOptions) {
    this.renderer.addHelper(name, fn, options);
    return this;
  }

  data(name: string, data: unknown) {
    this.renderer.extraData[name] = data;
    return this;
  }

  copy(from: string, to = from) {
    this.source.addStaticFile(join("/", from), join("/", to));
    return this;
  }

  ignore(...paths: string[]) {
    paths.forEach((path) => this.source.addIgnoredPath(join("/", path)));
    return this;
  }

  scopedUpdates(...scopes: ScopeFilter[]) {
    scopes.forEach((scope) => this.#scopes.add(scope));
    return this;
  }

  async clear() {
    await this.emitter.clear();
  }

  async build() {
    const buildMetric = this.metrics.start("Build (entire site)");

    if (await this.dispatchEvent({ type: "beforeBuild" }) === false) {
      return buildMetric.stop();
    }

    await this.clear();

    let metric = this.metrics.start("Copy (all files)");
    for (const [from, to] of this.source.staticFiles) {
      await this.emitter.copyFile(from, to);
    }
    metric.stop();

    metric = this.metrics.start("Load (all pages)");
    await this.source.load();
    metric.stop();

    metric = this.metrics.start(
      "Preprocess + render + process (all pages)",
    );
    await this.renderer.renderPages(this.source.pages);
    metric.stop();

    if (await this.dispatchEvent({ type: "beforeSave" }) === false) {
      return buildMetric.stop();
    }

    // Save the pages
    metric = this.metrics.start("Save (all pages)");
    await concurrent(
      this.pages,
      (page) => this.emitter.savePage(page),
    );
    metric.stop();

    buildMetric.stop();
    await this.dispatchEvent({ type: "afterBuild" });

    // Print or save the collected metrics
    const { metrics } = this.options;

    if (typeof metrics === "string") {
      await this.metrics.save(join(this.options.cwd, metrics));
    } else if (metrics) {
      this.metrics.print();
    }
  }

  async update(files: Set<string>) {
    if (await this.dispatchEvent({ type: "beforeUpdate", files }) === false) {
      return;
    }

    const changes = new Changes(this.#scopes);

    for (const file of files) {
      changes.add(file);

      // It's a static file
      const entry = this.#isStaticFile(file);

      if (entry) {
        const [from, to] = entry;

        await this.emitter.copyFile(file, join(to, file.slice(from.length)));
        continue;
      }

      await this.source.reload(file);
    }

    const filter = changes.getFilter();

    await this.renderer.renderPages(filter(this.source.pages));

    if (await this.dispatchEvent({ type: "beforeSave" }) === false) {
      return;
    }

    await concurrent(
      this.pages,
      (page) => this.emitter.savePage(page),
    );
    await this.dispatchEvent({ type: "afterUpdate", files });
  }

  async renderPage(file: string): Promise<Page | undefined> {
    await this.source.reload(file);
    const page = this.source.getFileOrDirectory(file) as Page | undefined;

    if (!page) {
      return;
    }
    await this.dispatchEvent({ type: "beforeRenderOnDemand", page });
    await this.renderer.renderPageOnDemand(page);
    return page;
  }

  async run(name: string, options: CommandOptions = {}) {
    return await this.scripts.run(options, name);
  }

  url(path: string, absolute = false) {
    if (
      path.startsWith("./") || path.startsWith("../") ||
      path.startsWith("?") || path.startsWith("#") || path.startsWith("//")
    ) {
      return path;
    }

    // It's a source file
    if (path.startsWith("~/")) {
      path = path.slice(1).replaceAll("/", SEP);
      path = decodeURI(path);

      // It's a page
      const page = this.pages.find((page) =>
        page.src.path + page.src.ext === path
      );

      if (page) {
        path = page.data.url as string;
      } else {
        // It's a static file
        const entry = this.#isStaticFile(path);

        if (entry) {
          const [from, to] = entry;
          path = normalizePath(join(to, path.slice(from.length)));
        } else {
          throw new Exception("Source file not found", { path });
        }
      }
    } else {
      // Absolute URLs are returned as is
      try {
        return new URL(path).href;
      } catch {
        // Ignore error
      }
    }

    if (!path.startsWith(this.options.location.pathname)) {
      path = posix.join(this.options.location.pathname, path);
    }

    return absolute ? this.options.location.origin + path : path;
  }

  /**
   * Check whether a file is included in the list of static files
   * and return a [from, to] tuple
   */
  #isStaticFile(file: string) {
    for (const entry of this.source.staticFiles) {
      const [from] = entry;

      if (file.startsWith(from)) {
        return entry;
      }
    }

    return false;
  }
}
