import { jsxRenderer } from "hono/jsx-renderer";
import { Link, ViteClient } from "vite-ssr-components/hono";

export const renderer = jsxRenderer(({ children }) => {
	return (
		<html lang="ja">
			<head>
				<ViteClient />
				<Link href="/src/style.css" rel="stylesheet" />
				<Link href="/node_modules/modern-normalize/modern-normalize.css" rel="stylesheet" />
				<title>落書きシティ</title>

				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</head>

			<body>{children}</body>
		</html>
	);
});
