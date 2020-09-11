import { React, ReactDOMServer } from "../deps/react.js";

if (!globalThis.React) {
  globalThis.React = React;
}

import Module from "./module.js";

export default class Jsx extends Module {
  render(content, data) {
    const element = super.render(content, data);

    return ReactDOMServer.renderToStaticMarkup(element);
  }
}
