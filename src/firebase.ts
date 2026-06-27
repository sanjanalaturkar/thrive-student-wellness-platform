import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDocFromServer 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase Config details from /firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyBbcWKhP2BJjYnI_mIqrrbX7aqNXctHXp0",
  authDomain: "ordinal-pagoda-vwjrd.firebaseapp.com",
  projectId: "ordinal-pagoda-vwjrd",
  storageBucket: "ordinal-pagoda-vwjrd.firebasestorage.app",
  messagingSenderId: "422770167643",
  appId: "1:422770167643:web:6fa31539da3e90a261947e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId
export const db = getFirestore(app, "ai-studio-24144e7a-e7fa-4902-89af-69b0617265d0");

// Initialize Auth
export const auth = getAuth(app);

// Validate Connection to Firestore on boot
async function testConnection() {
  try {
    // Simply fetch a non-existent document to test connectivity
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firestore connection successfully verified.");
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.error("Please check your Firebase configuration: Firestore appears offline.");
    } else {
      console.log("Firestore initialized successfully (received standard response).");
    }
  }
}

testConnection();
