import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCqQvQq8YnGeRqfrxGPGT-FYnfcPKKkzzI',
  authDomain: 'zaqvki-5241f.firebaseapp.com',
  projectId: 'zaqvki-5241f',
  storageBucket: 'zaqvki-5241f.firebasestorage.app',
  messagingSenderId: '493129666426',
  appId: '1:493129666426:web:ae64c3573779b534ae10c3',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const subscribeToAuthChanges = (callback) =>
  onAuthStateChanged(auth, callback);

const applyAuthPersistence = async (rememberSession) => {
  await setPersistence(
    auth,
    rememberSession ? browserLocalPersistence : browserSessionPersistence,
  );
};

export const signInWithEmail = async (email, password, rememberSession = true) => {
  await applyAuthPersistence(rememberSession);
  return signInWithEmailAndPassword(auth, email, password);
};

export const registerWithEmail = async (
  email,
  password,
  rememberSession = true,
) => {
  await applyAuthPersistence(rememberSession);
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signOutUser = () => signOut(auth);
