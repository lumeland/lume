import { React, ReactDOMServer } from "../../deps/react.ts";
import { Data } from "../../core.ts";
import Module, { Content } from "./module.ts";

// @ts-ignore: Property 'React' does not exist on type 'Window & typeof globalThis'.
window.React ||= React;

export default class Jsx extends Module {
  async render(content: Content, data: Data) {
    if (!data.children && data.content) {
      // @ts-ignore: Property 'createElement' does not exist on type '{}'.
      data.children = React.createElement("div", {
        dangerouslySetInnerHTML: { __html: data.content },
      });
    }

    const element = await super.render(content, data);
    data.children = element;

    // @ts-ignore: Property 'renderToStaticMarkup' does not exist on type '{}'.
    return ReactDOMServer.renderToStaticMarkup(element);
  }
}
