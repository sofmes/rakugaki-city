import { jsxRenderer } from "hono/jsx-renderer";
import { Link, ViteClient } from "vite-ssr-components/hono";

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="ja">
      <head>
        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
        <title>落書きシティ</title>

        <meta
          name="viewport"
          content="width=device-width, height=device-height, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0"
        />
      </head>

      <body>{children}</body>
    </html>
  );
});
