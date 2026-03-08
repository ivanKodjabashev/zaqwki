import { initializeApp } from 'firebase/app';
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

export const db = getFirestore(app);
