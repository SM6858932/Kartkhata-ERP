import admin from 'firebase-admin';

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'foodcart-khata';

function getServiceAccount(): admin.ServiceAccount {
  if (serviceAccountBase64) {
    const json = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
    return JSON.parse(json);
  }
  try {
    return require('../../foodcart-khata-firebase-adminsdk-fbsvc-aa89ea49c6.json');
  } catch {
    return {
      projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(getServiceAccount()),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'foodcart-khata.appspot.com',
  });
}

export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();
export const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;
