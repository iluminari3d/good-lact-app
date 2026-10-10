// Configurazione del client web di Firebase. Questi valori sono pubblici per
// progettazione (finiscono in ogni sito che usa Firebase): la protezione dei
// dati sta nelle regole di Firestore (firestore.rules) e nell'autenticazione.
export const firebaseConfig = {
  apiKey: 'AIzaSyBxC5RW7u6-YQLcJ-PkGOSpy0JPIPGEAn8',
  authDomain: 'good-lact.firebaseapp.com',
  projectId: 'good-lact',
  storageBucket: 'good-lact.firebasestorage.app',
  messagingSenderId: '865297635774',
  appId: '1:865297635774:web:05d3646bf6383cdbaf01ef',
} as const;
