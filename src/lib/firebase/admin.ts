/* Copilot instructions:
   Initialize Firebase Admin SDK for server-only code (API routes, cron).
   Expect service account credentials in environment variables.
   This file MUST NOT be imported into client bundles.
*/
import admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!admin.apps.length) {
  if (!projectId || !clientEmail || !privateKey) {
    // Throw in server code so misconfigured deploys fail loudly.
    throw new Error('Missing Firebase admin credentials in environment variables.');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      // Replace literal \n sequences with actual newlines if needed
      privateKey: privateKey.replace(/\\n/g, '\n'),
    } as admin.ServiceAccount),
  });
}

export const adminDb = admin.firestore();
