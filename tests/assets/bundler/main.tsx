/// <reference lib="dom" />
import Title from "./modules/title.tsx";
import { salute } from "./modules/utils.ts";
import React from "npm:react";
import ReactDOM from "npm:react-dom";

const content = salute("Oscar");

ReactDOM.render(<Title salute={content} />, document.getElementById("app"));
