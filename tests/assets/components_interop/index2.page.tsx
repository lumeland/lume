import { Data } from "../../../core/file.ts";

export default function ({ comp }: Data) {
  return <>
    <comp.Title />
    <hr/>
    <comp.Title>Click <em>here</em></comp.Title>
    <hr/>
    <comp.Title content={<em>Benvido</em>}/>
    <hr/>
    <hr/>
    <comp.subtitle />
    <hr/>
    <comp.subtitle>Click here</comp.subtitle>
    <hr/>
    <comp.subtitle content="Benvido"/>
  </>
}
