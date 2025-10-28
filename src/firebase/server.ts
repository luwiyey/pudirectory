// IMPORTANT: Do not modify this file.
// This file is used for server-side Firebase interactions and is essential for
// Server Actions and other backend operations.

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

let firebaseApp: FirebaseApp;

// This is a singleton pattern to ensure Firebase is initialized only once on the server.
if (getApps().length === 0) {
  firebaseApp = initializeApp(firebaseConfig, 'server-app');
} else {
  firebaseApp = getApp('server-app');
}

/**
 * Provides the core Firebase SDKs for server-side use.
 *
 * @returns An object containing the server-initialized Auth and Firestore SDKs.
 */
export function getSdks() {
  return {
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}
