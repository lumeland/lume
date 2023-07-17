/** @jsxImportSource npm:react@18.2.0 */

export const layout = "layout.jsx";
export const title = "This is the title";

// Export a function
export default ({ title }, { url }) => (
  <>
    <h1>{title}</h1>
    <p>
      This is a JSX page <a href={url("/")}>Go to home</a>
    </p>
  </>
);
