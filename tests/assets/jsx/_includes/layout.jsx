/** @jsxImportSource npm:react@18.2.0 */

export default ({ children, title }) => (
  <html>
    <head>
      <title>{title}</title>
    </head>
    <body>
      <main>
        {children}
      </main>
    </body>
  </html>
);
