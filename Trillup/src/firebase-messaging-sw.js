// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/7.14.4/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.14.4/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
firebase.initializeApp({
  apiKey: "AIzaSyCXl-_N35wR6xjm96lv-dmKe306n0CWFew",
  authDomain: "push-notification-testin-fb795.firebaseapp.com",
  databaseURL: "https://push-notification-testin-fb795.firebaseio.com",
  projectId: "push-notification-testin-fb795",
  storageBucket: "push-notification-testin-fb795.appspot.com",
  messagingSenderId: "828532505827",
  appId: "1:828532505827:web:88fd625990ebf7cad959d6",
  measurementId: "G-2SG7W0SHTW"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler((payload) => {
  // console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/firebase-logo.png'
  };

  return self.registration.showNotification(notificationTitle,
    notificationOptions);
});