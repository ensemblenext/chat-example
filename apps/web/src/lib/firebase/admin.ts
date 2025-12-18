import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK using Application Default Credentials (ADC)
// Local: Run `gcloud auth application-default login` first
// Production: Firebase App Hosting provides credentials automatically
const app = getApps().length === 0
  ? initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'ensembleapp-chat',
    })
  : getApps()[0];

export const adminAuth = getAuth(app);
