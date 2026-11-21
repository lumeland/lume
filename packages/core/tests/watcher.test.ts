import { beforeEach, describe, expect, it, vi } from "vitest";
import Path from "../src/path.ts";

const h = vi.hoisted(() => ({
  stream: undefined as unknown as ReturnType<typeof createStream>,
  parents: new Map<string, string[]>(),
  calls: [] as string[],
}));

vi.mock("../src/services/fs.ts", () => ({
  watchFiles: () => h.stream.iterator,
}));

vi.mock("../src/services/hmr.ts", () => ({
  updateVersion() {},
  updateDependencies(url: string) {
    // The real generator recurses into the importers, invalidating each.
    const visit = (u: string): string[] => {
      h.calls.push(u);
      return (h.parents.get(u) ?? []).flatMap((dep) => [dep, ...visit(dep)]);
    };

    return visit(url);
  },
}));

import FSWatcher from "../src/watcher.ts";

const ROOT = "/site";

/** A controllable replacement for the `fsPromises.watch()` async iterator */
function createStream() {
  let queue: string[][] = [];
  let pending: ((result: IteratorResult<string[], void>) => void) | null = null;
  let waiting = false;
  let closed = false;
  let idleWaiters: (() => void)[] = [];

  const notifyIdle = () => {
    const waiters = idleWaiters;
    idleWaiters = [];
    waiters.forEach((resolve) => resolve());
  };

  const iterator: AsyncIterableIterator<string[]> = {
    [Symbol.asyncIterator]() {
      return iterator;
    },
    next() {
      if (queue.length) {
        return Promise.resolve({ value: queue.shift()!, done: false });
      }

      if (closed) {
        return Promise.resolve({ value: undefined, done: true });
      }

      return new Promise((resolve) => {
        pending = resolve;
        waiting = true;
        notifyIdle();
      });
    },
  };

  return {
    iterator,
    /** Emit a batch of changed paths, as `fsPromises.watch()` would */
    push(batch: string[]) {
      waiting = false;
      if (pending) {
        const resolve = pending;
        pending = null;
        resolve({ value: batch, done: false });
        return;
      }
      queue.push(batch);
    },
    /** Resolves when the watcher is blocked waiting for the next batch */
    idle() {
      if (waiting) return Promise.resolve();
      return new Promise<void>((resolve) => idleWaiters.push(resolve));
    },
    /** Stop the iteration without emitting another batch */
    end() {
      closed = true;
      if (pending) {
        const resolve = pending;
        pending = null;
        resolve({ value: undefined, done: true });
      }
      notifyIdle();
    },
  };
}

async function startWatcher(options: {
  ignore?: (string | ((path: string) => boolean))[];
  dependencies?: Record<string, string[]>;
}) {
  const watcher = new FSWatcher({
    root: ROOT,
    debounce: 1,
    ignore: options.ignore,
    dependencies: options.dependencies ?? {},
  });
  const events: Set<string>[] = [];

  watcher.addEventListener("change", (event) => {
    events.push(event.files!);
  });

  const done = watcher.start();
  await h.stream.idle();

  return { events, done };
}

describe("FSWatcher", () => {
  beforeEach(() => {
    h.stream = createStream();
    h.parents = new Map();
    h.calls = [];
  });

  it("Reports the changed files, relative to the root", async () => {
    const { events } = await startWatcher({});

    h.stream.push(["/site/styles.css", "/site/index.vto"]);
    await vi.waitFor(() => expect(events.length).toBe(1));

    expect(events[0]).toEqual(new Set(["/styles.css", "/index.vto"]));
  });

  it("Ignores files below an ignored path", async () => {
    const { events } = await startWatcher({ ignore: ["/generated"] });

    h.stream.push(["/site/generated/tokens.css"]);
    await h.stream.idle();
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(events).toEqual([]);
  });

  it("Marks the dependent of a change below an ignored path", async () => {
    const { events } = await startWatcher({
      ignore: ["/generated"],
      dependencies: { "/styles.css": ["/generated/tokens.css"] },
    });

    h.stream.push(["/site/generated/tokens.css"]);
    await vi.waitFor(() => expect(events.length).toBe(1));

    expect(events[0]).toEqual(new Set(["/styles.css"]));
  });

  it("Marks the dependents of a file found through HMR", async () => {
    const changed = Path.toFileUrl("/site/a.vto").href;
    h.parents.set(changed, [Path.toFileUrl("/site/b.ts").href]);

    const { events } = await startWatcher({
      dependencies: { "/c.vto": ["/b.ts"] },
    });

    h.stream.push(["/site/a.vto"]);
    await vi.waitFor(() => expect(events.length).toBe(1));

    expect(events[0]).toEqual(new Set(["/a.vto", "/b.ts", "/c.vto"]));
  });

  it("Follows manual dependencies transitively", async () => {
    const { events } = await startWatcher({
      dependencies: { "/b.css": ["/a.css"], "/c.css": ["/b.css"] },
    });

    h.stream.push(["/site/a.css"]);
    await vi.waitFor(() => expect(events.length).toBe(1));

    expect(events[0]).toEqual(new Set(["/a.css", "/b.css", "/c.css"]));
  });

  it("Marks manual dependents of non-ignored changes", async () => {
    const { events } = await startWatcher({
      dependencies: { "/styles.css": ["/vendor/reset.css"] },
    });

    h.stream.push(["/site/vendor/reset.css"]);
    await vi.waitFor(() => expect(events.length).toBe(1));

    expect(events[0]).toEqual(new Set(["/styles.css", "/vendor/reset.css"]));
  });

  it("Marks the parents detected by HMR", async () => {
    const changed = Path.toFileUrl("/site/changed.ts").href;
    const importer = Path.toFileUrl("/site/importer.ts").href;
    h.parents.set(changed, [importer]);

    const { events } = await startWatcher({});

    h.stream.push(["/site/changed.ts"]);
    await vi.waitFor(() => expect(events.length).toBe(1));

    expect(events[0]).toEqual(new Set(["/changed.ts", "/importer.ts"]));
    // The importer is invalidated by updateDependencies' own recursion.
    expect(h.calls).toEqual([changed, importer]);
  });

  it("Invalidates a file once when it is also an importer of another changed file", async () => {
    const b = Path.toFileUrl("/site/b.ts").href;
    const p = Path.toFileUrl("/site/p.ts").href;
    h.parents.set(b, [p]);

    const { events } = await startWatcher({});

    h.stream.push(["/site/b.ts", "/site/p.ts"]);
    await vi.waitFor(() => expect(events.length).toBe(1));

    expect(events[0]).toEqual(new Set(["/b.ts", "/p.ts"]));
    expect(h.calls.filter((url) => url === p)).toEqual([p]);
  });

  it("Updates the dependencies of a file once, even if it is also a dependent", async () => {
    const changed = Path.toFileUrl("/site/changed.css").href;

    const { events } = await startWatcher({
      dependencies: { "/styles.css": ["/changed.css"] },
    });

    h.stream.push(["/site/changed.css"]);
    await vi.waitFor(() => expect(events.length).toBe(1));

    expect(events[0]).toEqual(new Set(["/styles.css", "/changed.css"]));
    expect(h.calls.filter((url) => url === changed)).toEqual([changed]);
  });

  it("Ignores files outside the root", async () => {
    const { events } = await startWatcher({});

    h.stream.push(["/elsewhere/styles.css"]);
    await h.stream.idle();
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(events).toEqual([]);
  });
});
