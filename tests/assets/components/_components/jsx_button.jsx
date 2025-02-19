/** @jsxImportSource npm:react@18.2.0 */

export const name = "button_jsx";
export const css = `
.button_jsx {
  color: white;
  background-color: blue;
}
`;

export default function ({ text }) {
  return <button type="button" className="button_jsx">{text}</button>;
}
