import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBJuf13Ka7yBde8D59r9Bt-HoPQuY03PS8',
  authDomain: 'babyname-e092d.firebaseapp.com',
  projectId: 'babyname-e092d',
  storageBucket: 'babyname-e092d.firebasestorage.app',
  messagingSenderId: '421196508532',
  appId: '1:421196508532:web:b3af7febafa2217db85021',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
