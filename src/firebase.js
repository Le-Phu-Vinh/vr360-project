import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCIEAeL3Y-ADBI5jP7mlm-1lWtIeK-Wl6A",
  authDomain: "vr360-project-2c7df.firebaseapp.com",
  projectId: "vr360-project-2c7df",
  storageBucket: "vr360-project-2c7df.firebasestorage.app",
  messagingSenderId: "646736489318",
  appId: "1:646736489318:web:4e5ae3499c6ccc6f91f6a7",
  measurementId: "G-D3SQRN8BBP"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
