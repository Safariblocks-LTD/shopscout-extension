import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCrApKcweIjfoaKCPh3IRqTAMyTi65KdG0",
  authDomain: "shopscout-9bb63.firebaseapp.com",
  projectId: "shopscout-9bb63",
  storageBucket: "shopscout-9bb63.firebasestorage.app",
  messagingSenderId: "647829782777",
  appId: "1:647829782777:web:e1e51c1c0a22dfdf2fe228",
  measurementId: "G-QPH51ENTS9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Set persistence to LOCAL so sessions persist across browser restarts
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

// Initialize Analytics (optional, only works in browser context)
let analytics;
try {
  analytics = getAnalytics(app);
} catch (error) {
  // Analytics might not work in extension context
  console.log('Analytics not available in extension context');
}

export { analytics };
export default app;
