import React from "https://deno.land/x/react_deno@17.0.2/react.ts";

interface Props {
  salute: string;
}

export default function Title({ salute }: Props) {
  return (
    <React.Fragment>
      <h1>{salute}</h1>
      <h2>This is a title</h2>
    </React.Fragment>
  );
}
