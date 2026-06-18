/* Copilot instructions:
   Initialize Firebase *client* SDK. This file should only be imported in
   browser/edge code paths. Server-side code must use admin.ts.
*/
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const clientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!clientConfig.projectId) {
  // Do not throw in the client file; calling code can handle missing config.
  // This allows local dev without immediate Firebase access.
  console.warn('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set.');
}

const app = !getApps().length ? initializeApp(clientConfig) : getApps()[0];
export const db = getFirestore(app);
