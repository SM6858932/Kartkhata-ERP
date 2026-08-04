import { Client, Storage, ID } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

/**
 * Normalize an Appwrite endpoint to the canonical full URL form.
 * Accepts:
 *   - https://nyc.cloud.appwrite.io/v1
 *   - nyc.cloud.appwrite.io/v1
 *   - https://nyc.cloud.appwrite.io/v1/
 * Always returns `https://<host>/v1`.
 */
function normalizeEndpoint(raw: string | undefined, fallback: string): string {
    const value = (raw || fallback).trim().replace(/\/+$/, '');
    // Strip any protocol prefix, then re-add https:// to guarantee a valid URL
    const withoutProtocol = value.replace(/^https?:\/\//i, '');
    return `https://${withoutProtocol}`;
}

const APPWRITE_ENDPOINT = normalizeEndpoint(
    process.env.APPWRITE_ENDPOINT,
    'https://nyc.cloud.appwrite.io/v1'
);
const projectId = process.env.APPWRITE_PROJECT_ID || '';
const apiKey = process.env.APPWRITE_API_KEY || '';
const bucketId = process.env.APPWRITE_BUCKET_ID || '';

let storage: Storage | null = null;

function getStorage(): Storage {
    if (!storage) {
        if (!projectId || !apiKey || !bucketId) {
            throw new Error(
                'Appwrite is not configured. Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY and APPWRITE_BUCKET_ID.'
            );
        }
        const client = new Client()
            .setEndpoint(APPWRITE_ENDPOINT)
            .setProject(projectId)
            .setKey(apiKey);
        storage = new Storage(client);
    }
    return storage;
}

/**
 * Upload a company logo to Appwrite Storage.
 * Returns a fully-qualified https URL pointing at the uploaded file.
 */
export async function uploadLogo(
    companyId: string,
    file: Buffer,
    _mimeType: string,
    fileName: string
): Promise<string> {
    const storageClient = getStorage();
    const fileId = ID.unique();
    const ext = fileName.split('.').pop() || 'png';
    // Use flat filename — Appwrite organizes files by ID, not path
    const flatFileName = `${companyId}-logo.${ext}`;

    const inputFile = InputFile.fromBuffer(file, flatFileName);

    const result = await storageClient.createFile(bucketId, fileId, inputFile);

    // Single-protocol, fully-qualified view URL
    return `${APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${result.$id}/view?project=${projectId}`;
}

/**
 * Delete a previously uploaded logo file from Appwrite Storage.
 * Robustly parses the file ID out of the URL regardless of extra path segments.
 */
export async function deleteLogo(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    try {
        const storageClient = getStorage();
        const url = new URL(fileUrl);

        // Path shape: /v1/storage/buckets/{bucketId}/files/{fileId}/view
        // (project query param may be present or absent)
        const segments = url.pathname.split('/').filter(Boolean);
        const filesIdx = segments.findIndex((s) => s === 'files');
        const fileId = filesIdx >= 0 && segments[filesIdx + 1] ? segments[filesIdx + 1] : null;

        if (fileId) {
            await storageClient.deleteFile(bucketId, fileId);
        }
    } catch (err) {
        console.error('Failed to delete Appwrite file:', err);
    }
}

