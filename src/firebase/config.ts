import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "foodcart-khata.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "foodcart-khata",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "foodcart-khata.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "107000967755",
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

let analytics = null;
if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    try {
        analytics = getAnalytics(app);
    } catch (e) {
        console.log('Analytics not available');
    }
}
export { analytics };

const isEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
if (isEmulator) {
    const host = Capacitor.isNativePlatform() ? '10.0.2.2' : 'localhost';
    try {
        connectFirestoreEmulator(db, host, 8080);
        connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    } catch (e) {
        console.warn('Firebase emulator connection skipped or already initialized', e);
    }
}