import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyANNb56JlfkoRIy2EautnDPvwcsOcY9yvY",
  authDomain: "taskrabbit-web-63d0b.firebaseapp.com",
  projectId: "taskrabbit-web-63d0b",
  storageBucket: "taskrabbit-web-63d0b.firebasestorage.app",
  messagingSenderId: "178615410723",
  appId: "1:178615410723:web:45b9e74eb69778d1bfd196"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services we’ll use
export const auth = getAuth(app);
export const db = getFirestore(app);
