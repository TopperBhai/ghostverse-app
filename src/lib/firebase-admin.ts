// GhostVerse — Firebase Admin SDK Initialization
import * as admin from "firebase-admin";

// Create a proxy DB that throws a clear error if used before initialization
const createUninitializedProxy = (serviceName: string) => {
  return new Proxy({}, {
    get: (_, prop) => {
      return () => {
        throw new Error(`🔥 Missing Firebase configuration! Cannot access ${serviceName}.${prop.toString()}. Please add FIREBASE_SERVICE_ACCOUNT to your .env file.`);
      };
    }
  });
};

let dbInstance: unknown = createUninitializedProxy("Firestore");
let authInstance: unknown = createUninitializedProxy("Auth");

if (!admin.apps.length) {
  try {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountStr && serviceAccountStr.trim() !== '""' && serviceAccountStr.trim() !== '') {
      // Parse the JSON string from the environment variable, robustly handling literal \n escapes
      const serviceAccount = JSON.parse(serviceAccountStr);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin SDK initialized successfully");
      
      dbInstance = admin.firestore();
      authInstance = admin.auth();
    } else {
      console.error("\n❌ ============================================");
      console.error("❌ FIREBASE INIT ERROR");
      console.error("❌ FIREBASE_SERVICE_ACCOUNT is empty in .env!");
      console.error("❌ The database will not work until you provide it.");
      console.error("❌ ============================================\n");
    }
  } catch (error) {
    console.error("\n❌ ============================================");
    console.error("❌ FIREBASE PARSE ERROR");
    console.error("❌ Your FIREBASE_SERVICE_ACCOUNT is not valid JSON!");
    console.error("❌", (error as Error).message);
    console.error("❌ ============================================\n");
  }
} else {
  // Hot reload safety
  dbInstance = admin.firestore();
  authInstance = admin.auth();
}

export const db = dbInstance as admin.firestore.Firestore;
export const auth = authInstance as admin.auth.Auth;
