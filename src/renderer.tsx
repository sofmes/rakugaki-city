import { jsxRenderer } from "hono/jsx-renderer";
import { ViteClient } from "vite-ssr-components/hono";

export const renderer = jsxRenderer(({ children, title, head, viewport }) => {
  return (
    <html lang="ja">
      <head>
        <ViteClient />
        <title>落書きシティ{title ? ` - ${title}` : ""}</title>

        <meta
          name="viewport"
          content={viewport ?? "width=device-width, height=device-height"}
        />

        {head}
      </head>

      <body>{children}</body>
    </html>
  );
});
