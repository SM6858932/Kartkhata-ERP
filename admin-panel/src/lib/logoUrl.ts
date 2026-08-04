/**
 * Normalize a stored logo URL into a single, valid, fully-qualified https URL.
 *
 * Handles the broken/legacy values that were persisted by earlier versions:
 *   - `https://https://nyc.cloud.appwrite.io/v1/...` (double protocol)
 *   - `blob:https://...` (browser blob URL — return as-is, can't be fixed)
 *   - relative paths like `/storage/...`
 *   - valid full URLs (returned as-is)
 */
export function normalizeLogoUrl(url: string): string {
    if (!url) return url;

    // Browser blob/data URLs are not service URLs — return as-is so the
    // in-memory preview still renders, but never persist them to the DB.
    if (url.startsWith('blob:') || url.startsWith('data:')) {
        return url;
    }

    // Strip a leading protocol so we can rebuild a clean single URL.
    let cleaned = url.replace(/^https?:\/\//i, '');

    // If the remaining string still starts with another protocol (e.g.
    // `https://https://...`), strip it again.
    while (cleaned.startsWith('https://') || cleaned.startsWith('http://')) {
        cleaned = cleaned.replace(/^https?:\/\//i, '');
    }

    // If there's nothing left, bail.
    if (!cleaned) return url;

    const endpoint = 'https://nyc.cloud.appwrite.io/v1';

// If it's already a full Appwrite URL (has /storage/...), just re-add the protocol.
    if (cleaned.includes('/storage/') || cleaned.includes('/v1/')) {
        return `https://${cleaned}`;
    }

    // Otherwise treat as a relative path and prefix with the endpoint.
    return `${endpoint}/${cleaned.replace(/^\//, '')}`;
}
