const publicFirebaseDefaults = {
  apiKey: 'AIzaSyDhnbN8hoyQC4sj3vq8KbAzVqKdF1c-B9g',
  authDomain: 'orbita-integrador.firebaseapp.com',
  projectId: 'orbita-integrador',
  appId: '1:103959113393:web:f55b73c07476160fbfbc90',
};

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || publicFirebaseDefaults.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || publicFirebaseDefaults.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || publicFirebaseDefaults.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || publicFirebaseDefaults.appId,
};

export const firebaseConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.length > 0 && !value.startsWith('cole-') && !value.startsWith('seu-'),
);
