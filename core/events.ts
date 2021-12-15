import type { Page } from "./filesystem.ts";

type Listener = [EventListener, EventOptions | undefined];

/**
 * Class to manage the event listeners
 * and dispatch events
 */
export default class Events {
  listeners = new Map<EventType, Set<Listener>>();

  /** Assign a listener to an event */
  addEventListener(
    type: EventType,
    listenerFn: EventListener,
    options?: EventOptions,
  ) {
    const listeners = this.listeners.get(type) || new Set();
    const listener: Listener = [listenerFn, options];

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

  /** Dispatch an event */
  async dispatchEvent(event: Event) {
    const { type } = event;
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

      if (await listenerFn(event) === false) {
        return false;
      }
    }

    return true;
  }
}

/** An event object */
export interface Event {
  /** The event type */
  type: EventType;

  /**
   * Available only in "beforeUpdate" and "afterUpdate"
   * contains the files that were changed
   */
  files?: Set<string>;

  /**
   * Available only in "beforeRenderOnDemand"
   * contains the page that will be rendered
   */
  page?: Page;
}

/** The available event types */
export type EventType =
  | "beforeBuild"
  | "afterBuild"
  | "beforeUpdate"
  | "afterUpdate"
  | "afterRender"
  | "beforeRenderOnDemand"
  | "beforeSave";

/** Event listener */
export type EventListener = (event: Event) => unknown;

/** The available options for events */
export interface EventOptions {
  /**
   * To indicate that the listener should be invoked at most once
   * after being added
   */
  once?: boolean;

  /**
   * The listener will be removed
   * when the given AbortSignal object's abort() method is called
   */
  signal?: AbortSignal;
}
