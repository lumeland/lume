import { Page } from "./filesystem.js";

/**
 * The data of a page
 */
export interface Data {
  tags?: string | string[];
  url?: string | ((page: Page) => string);
  draft?: boolean;
  renderOrder?: number;
  content?: unknown;
  layout?: string;
  templateEngine?: string | string[];
  [index: string]: unknown;
}

/**
 * Generical helper to use in the template engines
 */
export type Helper = (...args: unknown[]) => string | Promise<string>;

/**
 * The available options for template helpers
 */
export interface HelperOptions {
  type: string;
  async?: boolean;
  body?: boolean;
}

/**
 * All available event types
 */
export type EventType =
  | "beforeBuild"
  | "afterBuild"
  | "beforeUpdate"
  | "afterUpdate"
  | "afterRender"
  | "beforeSave";

/**
 * An event object
 */
export interface Event {
  type: EventType;
  files?: string[];
}
