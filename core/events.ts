type Listener<E extends Event> = [EventListener<E>, EventOptions | undefined];

/**
 * Class to manage the event listeners
 * and dispatch events
 */
export default class Events<E extends Event> {
  listeners = new Map<string, Set<Listener<E>>>();

  /** Assign a listener to an event */
  addEventListener(
    type: string,
    listenerFn: EventListener<E>,
    options?: EventOptions,
  ) {
    const listeners = this.listeners.get(type) || new Set();
    const listener: Listener<E> = [listenerFn, options];

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
  async dispatchEvent(event: E) {
    const { type } = event;
    const listeners = this.listeners.get(type);

    if (listeners) {
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
    }

    const customEvent = new CustomEvent(`lume:${type}`, {
      cancelable: true,
      detail: event,
    });

    return dispatchEvent(customEvent);
  }
}

/** An event object */
export interface Event {
  /** The event type */
  type: string;
}

/** Event listener */
export type EventListener<E extends Event> = (event: E) => unknown;

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
