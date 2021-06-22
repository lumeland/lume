import { React, ReactDOMServer } from "../deps/react.ts";
import { Data } from "../types.ts";

window.React ||= React;

import Module from "./module.ts";

export default class Jsx extends Module {
  async render(content: unknown, data: Data) {
    if (!data.children && data.content) {
      data.children = React.createElement("div", {
        dangerouslySetInnerHTML: { __html: data.content },
      });
    }

    const element = await super.render(content, data);
    data.children = element;

    return ReactDOMServer.renderToStaticMarkup(element);
  }
}
