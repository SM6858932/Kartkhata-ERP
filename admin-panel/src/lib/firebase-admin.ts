import admin from 'firebase-admin';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'foodcart-khata';

function getServiceAccount(): admin.ServiceAccount {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (b64) {
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  }
  return {
    projectId,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };
}

function getAdmin(): typeof admin {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(getServiceAccount()),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'foodcart-khata.appspot.com',
    });
  }
  return admin;
}

export function auth() {
  return getAdmin().auth();
}

export function db() {
  return getAdmin().firestore();
}

export function storage() {
  return getAdmin().storage();
}

export const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;
