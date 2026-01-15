import admin from "firebase-admin";
import { getApps } from "firebase-admin/app";

let serviceAccount;
try {
  serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
  );
} catch (error) {
  console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", error);
  throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY must be a valid JSON string");
}

if (!getApps().length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const adminDb = admin.firestore();

export { adminDb };