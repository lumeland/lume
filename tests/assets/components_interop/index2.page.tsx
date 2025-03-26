// deno-lint-ignore-file jsx-no-children-prop

export default function ({ comp }: Lume.Data) {
  return <>
    <comp.Title />
    <hr/>
    <comp.Title>Click <em>here</em></comp.Title>
    <hr/>
    <comp.Title content={<em>Benvido</em>}/>
    <hr/>
    <comp.Title children="Benvido"/>
    <hr/>
    <comp.subtitle />
    <hr/>
    <comp.subtitle>Click here</comp.subtitle>
    <hr/>
    <comp.subtitle content="Benvido"/>
    <hr/>
    <comp.subtitle children="Benvido"/>
  </>
}