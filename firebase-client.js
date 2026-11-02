import {initializeApp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
const app=initializeApp({apiKey:"AIzaSyBS5bUa2OjGM9zawQIbXKmazkdiF3OGyt8",authDomain:"buraimidta.firebaseapp.com",projectId:"buraimidta",storageBucket:"buraimidta.firebasestorage.app",messagingSenderId:"895412708811",appId:"1:895412708811:web:cbb8d0d1baf45f16ab424e"});
const auth=getAuth(app);
export const login=()=>signInWithPopup(auth,new GoogleAuthProvider());
export const logout=()=>signOut(auth);
export async function user(){await auth.authStateReady();return auth.currentUser;}
