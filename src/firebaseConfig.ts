import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD6HimCyz13Y9ew856k5kohK7G5LJGgrlM",
  authDomain: "travel-123-48553.firebaseapp.com",
  projectId: "travel-123-48553",
  storageBucket: "travel-123-48553.appspot.com",
  messagingSenderId: "958870633268",
  appId: "1:958870633268:web:1d4f2323e09355ee520361",
  measurementId: "G-BFHMGLD7SP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
export const auth = getAuth(app);
export { firebaseConfig, app, analytics, firestore, storage };
