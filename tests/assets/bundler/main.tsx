/// <reference lib="dom" />
import Title from "mod/title.tsx";
import { salute } from "mod/utils.ts";
import React from "https://deno.land/x/react_deno@17.0.2/react.ts";
import ReactDOM from "https://deno.land/x/react_deno@17.0.2/dom.ts";

const content = salute("Oscar");

ReactDOM.render(<Title salute={content} />, document.getElementById("app"));
