import { assert, assertEquals } from "../deps/assert.ts";
import { reload } from "../middlewares/reload.ts";
import type { Watcher, WatchEvent, WatchEventType } from "../core/watcher.ts";
import type { EventListener, EventOptions } from "../core/events.ts";

// Minimal Watcher stub. The reload middleware only calls `addEventListener`
// and `start` during construction, so these are no-op implementations.
class MockWatcher implements Watcher {
  addEventListener(
    _type: WatchEventType,
    _listener: EventListener<WatchEvent>,
    _options?: EventOptions,
  ): this {
    return this;
  }
  dispatchEvent(_event: WatchEvent): Promise<boolean> {
    return Promise.resolve(true);
  }
  start(): Promise<void> {
    return Promise.resolve();
  }
}

Deno.test(
  "reload middleware preserves multi-byte UTF-8 chars across chunk boundaries",
  async () => {
    // "メモリ帯域" where "モ" is 0xE3 0x83 0xA2 in UTF-8.
    // Split the bytes so the chunk boundary falls in the middle of "モ",
    // which used to corrupt the character into U+FFFD replacements.
    const html = "<html><body>メモリ帯域</body></html>";
    const moIndex = html.indexOf("モ");
    const prefix = new TextEncoder().encode(html.slice(0, moIndex));
    const moBytes = new TextEncoder().encode("モ"); // 3 bytes
    const suffix = new TextEncoder().encode(html.slice(moIndex + 1));
    const chunk1 = new Uint8Array([...prefix, moBytes[0], moBytes[1]]);
    const chunk2 = new Uint8Array([moBytes[2], ...suffix]);

    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(chunk1);
        controller.enqueue(chunk2);
        controller.close();
      },
    });

    const upstream = new Response(body, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });

    const middleware = reload({
      watcher: new MockWatcher(),
      basepath: "/",
    });

    const response = await middleware(
      new Request("http://localhost/"),
      () => Promise.resolve(upstream),
      {} as Deno.ServeHandlerInfo,
    );

    const decoded = await response.text();
    // The original HTML content must survive intact.
    assert(
      decoded.includes("メモリ帯域"),
      `expected "メモリ帯域" to be preserved, got: ${decoded}`,
    );
    // And no UTF-8 replacement characters (U+FFFD) should appear.
    assertEquals(
      decoded.includes("\uFFFD"),
      false,
      "response must not contain U+FFFD replacement characters",
    );
  },
);
