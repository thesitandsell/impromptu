// ─────────────────────────────────────────────────────────────
//  PASTE YOUR FIREBASE CONFIG HERE
//  Firebase Console → Your Project → Project Settings → Your Apps
// ─────────────────────────────────────────────────────────────
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            "AIzaSyCcoPMh_tKHPdpBaDogmH6BhQDkg-uBxsE",
  authDomain:        "edwardsimpromputsite.firebaseapp.com",
  projectId:         "edwardsimpromptusite",
  storageBucket:     "edwardsimpromptusite.firebasestorage.app",
  messagingSenderId: "656166939097",
  appId:             "1:656166939097:web:02d23964ac8723b4cc91c8",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
