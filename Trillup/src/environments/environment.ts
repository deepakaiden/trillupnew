// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  host: 'localhost',
  domain: 'trillup.com',
  frontEndURL: 'http://localhost:4200/',
  backendURL: 'http://localhost:3000/',
  backendFileUploadURL: 'http://localhost:3000/teamChannel/uploadFile',
  firebase: {
    apiKey: "AIzaSyCXl-_N35wR6xjm96lv-dmKe306n0CWFew",
    authDomain: "push-notification-testin-fb795.firebaseapp.com",
    databaseURL: "https://push-notification-testin-fb795.firebaseio.com",
    projectId: "push-notification-testin-fb795",
    storageBucket: "push-notification-testin-fb795.appspot.com",
    messagingSenderId: "828532505827",
    appId: "1:828532505827:web:88fd625990ebf7cad959d6",
    measurementId: "G-2SG7W0SHTW"
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
