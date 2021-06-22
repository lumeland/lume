import { React, ReactDOMServer } from "../deps/react.js";

window.React ||= React;

import Module from "./module.js";

export default class Jsx extends Module {
  async render(content, data) {
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
