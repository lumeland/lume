/// <reference lib="dom" />
import React from "https://deno.land/x/react_deno@17.0.2/react.ts";
import ReactDOM from "https://deno.land/x/react_deno@17.0.2/dom.ts";
import Title from "./modules/title.tsx";
import { salute } from "./utils.ts";

const content = salute("Óscar");

ReactDOM.render(<Title salute={content} />, document.getElementById("app"));
