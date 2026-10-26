/* Compiti di casa · collegamento a Firebase (l'unico modulo: carica le librerie e le rende disponibili agli altri file) */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js';
import { getAuth, initializeAuth, inMemoryPersistence, onAuthStateChanged, signInWithEmailAndPassword,
         createUserWithEmailAndPassword, signOut, updatePassword, reauthenticateWithCredential,
         EmailAuthProvider, sendPasswordResetEmail, deleteUser }
  from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-app-check.js';
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager,
         collection, doc, onSnapshot, query, where, orderBy, limit, addDoc, setDoc, updateDoc, deleteDoc,
         getDoc, getDocs, writeBatch, runTransaction, serverTimestamp, getAggregateFromServer, sum, Timestamp }
  from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey:            "AIzaSyBDHYSOJjyexvC1rw8a9ZCfuu-BhLKtDLI",
  authDomain:        "duty-scheduler-bdd9e.firebaseapp.com",
  projectId:         "duty-scheduler-bdd9e",
  storageBucket:     "duty-scheduler-bdd9e.firebasestorage.app",
  messagingSenderId: "106420224624",
  appId:             "1:106420224624:web:7e9647dac88083247feab5"
};

// App Check: solo la pagina pubblicata può parlare con Firebase, non uno script che prova i PIN a raffica.
// Chiave del sito di Google Cloud Fraud Defense (ex reCAPTCHA Enterprise), tipo Sito web, senza casella di controllo.
// Vuota = App Check spento. La stessa chiave va registrata in Console Firebase › App Check.
const APP_CHECK_SITE_KEY = '';
const appCheck = app => APP_CHECK_SITE_KEY &&
  initializeAppCheck(app, {provider: new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY), isTokenAutoRefreshEnabled: true});

const fbApp = initializeApp(firebaseConfig);
appCheck(fbApp);
const auth = getAuth(fbApp);
// istanza "usa e getta" per creare gli account dei figli senza far uscire il genitore
const secApp = initializeApp(firebaseConfig, 'secondary');
appCheck(secApp);
const secAuth = initializeAuth(secApp, {persistence: inMemoryPersistence});
// i dati restano salvati anche sul dispositivo: apertura istantanea, funziona offline, meno letture
let db;
try { db = initializeFirestore(fbApp, {localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})}); }
catch(e){ db = getFirestore(fbApp); }

// gli altri file dell'app sono script normali che condividono questi nomi
Object.assign(window, {
  firebaseConfig, fbApp, auth, secAuth, db,
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updatePassword,
  reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail, deleteUser,
  collection, doc, onSnapshot, query, where, orderBy, limit, addDoc, setDoc, updateDoc, deleteDoc,
  getDoc, getDocs, writeBatch, runTransaction, serverTimestamp, getAggregateFromServer, sum, Timestamp,
});
