'use client';

// IMPORTANT: Do not modify this file.
// This file is the main entry point for all Firebase functionality.
// It initializes Firebase on the client-side and exports all the necessary hooks and providers.

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

/**
 * Initializes the Firebase app.
 *
 * This function handles the initialization of the Firebase app, ensuring that it is only
 * initialized once.
 *
 * @returns An object containing the initialized Firebase app, Auth, and Firestore services.
 */
export function initializeFirebase() {
  let firebaseApp: FirebaseApp;

  if (getApps().length === 0) {
    // Initialize with the explicit config from `firebase/config.ts`
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    // If already initialized, get the existing app.
    firebaseApp = getApp();
  }

  return getSdks(firebaseApp);
}

/**
 * Bundles the core Firebase SDKs into a single object.
 *
 * @param firebaseApp - The initialized FirebaseApp instance.
 * @returns An object containing the Auth and Firestore SDKs.
 */
export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}

// Export all the necessary hooks and components for use throughout the app.
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
