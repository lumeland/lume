export const className = "button_jsx";
export const name = "button_jsx";
export const css = `
.button_jsx {
  color: white;
  background-color: blue;
}
`;

export default function ({ text, className }) {
  return <button type="button" class={ className }>{text}</button>;
}
