import { readFile } from 'node:fs/promises';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountPath = new URL('../firebase-service-account.json', import.meta.url);
const serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = getFirestore();
const collectionName = 'calder_access_test';
const docId = `check_${Date.now()}`;

await db.collection(collectionName).doc(docId).set({
  createdAt: new Date().toISOString(),
  note: 'Access verified from Calder on Raspberry Pi',
});

console.log(`Firestore write complete: ${collectionName}/${docId}`);
