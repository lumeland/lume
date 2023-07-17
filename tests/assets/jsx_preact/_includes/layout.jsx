/** @jsxImportSource npm:preact@10.10.6 */

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
