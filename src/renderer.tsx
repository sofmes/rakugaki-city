import { jsxRenderer } from "hono/jsx-renderer";
import { Link, ViteClient } from "vite-ssr-components/hono";

export const renderer = jsxRenderer(({ children }) => {
	return (
		<html lang="ja">
			<head>
				<ViteClient />
				<Link href="/src/style.css" rel="stylesheet" />
				<title>落書きシティ</title>
			</head>

			<body>{children}</body>
		</html>
	);
});
