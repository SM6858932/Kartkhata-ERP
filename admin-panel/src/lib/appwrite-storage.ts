import { Client, Storage, ID } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

const rawEndpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const endpoint = rawEndpoint.replace(/\/+$/, '');
const projectId = process.env.APPWRITE_PROJECT_ID || '';
const apiKey = process.env.APPWRITE_API_KEY || '';
const bucketId = process.env.APPWRITE_BUCKET_ID || '';

let storage: Storage | null = null;

function getStorage(): Storage {
    if (!storage) {
        const client = new Client()
            .setEndpoint(endpoint)
            .setProject(projectId)
            .setKey(apiKey);
        storage = new Storage(client);
    }
    return storage;
}

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

    const result = await storageClient.createFile(
        bucketId,
        fileId,
        inputFile
    );

    // Return the view URL which includes the fileId as the storage key
    return `${endpoint}/storage/buckets/${bucketId}/files/${result.$id}/view?project=${projectId}`;
}

export async function deleteLogo(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    try {
        const storageClient = getStorage();
        const url = new URL(fileUrl);
        const pathParts = url.pathname.split('/');
        const fileId = pathParts[pathParts.length - 1]?.split('?')[0];

        if (fileId) {
            await storageClient.deleteFile(bucketId, fileId);
        }
    } catch (err) {
        console.error('Failed to delete Appwrite file:', err);
    }
}