import { React, ReactDOMServer } from "../../deps/react.ts";
import { Data } from "../../core.ts";
import Module, { Content } from "./module.ts";

window.React ||= React;

export default class Jsx extends Module {
  async render(content: Content, data: Data) {
    if (!data.children && data.content) {
      data.children = React.createElement("div", {
        dangerouslySetInnerHTML: { __html: data.content },
      });
    }

    const element = React.isValidElement(content)
      ? content
      : await super.render(content, data) as React.ReactElement;

    data.children = element;

    return ReactDOMServer.renderToStaticMarkup(element);
  }
}
