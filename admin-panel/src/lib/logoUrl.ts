export function normalizeLogoUrl(url: string): string {
    if (!url) return url;
    // If URL already has a valid protocol, use it as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    // If it's a relative path, prefix with the Appwrite endpoint
    const endpoint = 'https://nyc.cloud.appwrite.io/v1';
    return `${endpoint}/${url.replace(/^\//, '')}`;
}
