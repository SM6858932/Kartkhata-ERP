export function normalizeLogoUrl(url: string): string {
  if (!url) return url;
  return url.replace(/^https?:\/\/(https?:\/\/)/, '$1');
}
