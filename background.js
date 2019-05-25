
var firebaseConfig = {
  apiKey: "AIzaSyCxCyVS2aFQuwIo7WS-S3nY6veMnCwlzyM",
  authDomain: "sync-internal.firebaseapp.com",
  databaseURL: "https://sync-internal.firebaseio.com",
  projectId: "sync-internal",
  storageBucket: "sync-internal.appspot.com"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var db = firebase.firestore();

firebase.auth().onAuthStateChanged(function(user) {
  console.log("onAuthStateChanged");
  if (user) {
   console.log("Logged-in under UID: " + user.uid);
   // User is signed in.
   chrome.bookmarks.onCreated.addListener(function (i, record) {
     console.log("Node created");
     console.log(i);
     console.log(record);
     db.collection("bookmarks").doc(user.uid).collection(navigator.userAgent.replace(/\//g,'')).doc(record.url.replace(/\//g,'')).set(record);
   });
   chrome.bookmarks.onRemoved.addListener(function (i, record) {
     console.log("Node removed");
     console.log(i);
     console.log(record);
     db.collection("bookmarks").doc(user.uid).collection(navigator.userAgent.replace(/\//g,'')).doc(record.node.url.replace(/\//g,'')).delete();
   });
  } else {
    // No user is signed in.
  }
});


try {
  fetch("https://us-central1-sync-internal.cloudfunctions.net/generateToken?uid=test")
    .then(function (response) {
      return response.text();
    }).then(function (answer) {
      var token = answer;
      firebase.auth().signInWithCustomToken(token).catch(function(error) {
      });
  });
} catch (err) {
  console.log('Cannot fetch database token');
}

