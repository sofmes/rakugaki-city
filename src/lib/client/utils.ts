export function getCookieValue(key: string) {
  const cookieItems = document.cookie.split(";");
  const item = cookieItems.find(
    (item) => item.split("=")[0].trim() === key.trim(),
  );

  if (item) {
    const cookieValue = decodeURIComponent(item.split("=")[1]);
    return cookieValue;
  }

  return null;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
