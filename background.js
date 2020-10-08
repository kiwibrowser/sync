var firebaseConfig = {
  // This is a public API key to access Firebase
  apiKey: 'AIzaSyCxCyVS2aFQuwIo7WS-S3nY6veMnCwlzyM',

  authDomain: 'sync-internal.firebaseapp.com',
  databaseURL: 'https://sync-internal.firebaseio.com',
  projectId: 'sync-internal',
  storageBucket: 'sync-internal.appspot.com'
};
async function updateRecordOnServer(i, record, commitInBatch) {
  record.device = localStorage.deviceId;
  var node = json_encode(record);
  console.log("node encoded -> "+node);
  var iv = crypto.getRandomValues(new Uint8Array(16));
  var encryptedData = await encrypt(string_to_array(node), base64_string_to_array(localStorage.pkey), iv, 'AES-CBC');
  encryptedData = array_to_base64_string(encryptedData);
  iv = array_to_base64_string(iv);
  if (commitInBatch) {
    if (batch && batch._mutations.length >= 400) {
      batch.commit();
      batch = db.batch();
    } else if (!batch) {
      batch = db.batch();
    }
    batch.set(db.collection('users').doc(localStorage.uid).collection('bookmarks').doc(record.id), {
      'data': encryptedData,
      'iv': iv
    });
  } else {
    db.collection('users').doc(localStorage.uid).collection('bookmarks').doc(record.id).set({
        'data': encryptedData,
        'iv': iv
      }).then(function () {
        console.log(" ---- Bookmark set with ID: " + record.id);
      })
      .catch(function (error) {
        console.error("Error on set bookmark with ID : " + record.id, error);
      });
  }
}

async function deleteRecordOnServer(i, record) {
  db.collection('users').doc(localStorage.uid).collection('bookmarks').doc(record.node.id).delete()
    .then(function () {
      console.log(" ---- Deleted bookmark with ID: ", record.node.id);
    })
    .catch(function (error) {
      console.error("Error deleting bookmark with ID: " + record.node.id, error);
    });
}

async function pushLocalBookmarksToServer(items, localOnly) {
  if (batch && batch._mutations.length && !batch._committed) {
    batch.commit();
    batch = db.batch();
  }
  if (!createdRoots[localStorage.deviceId]) {
    createdRoots[localStorage.deviceId] = true;
    bookmarksToShowInTheUI.push({
      'id': localStorage.deviceId + '|0',
      'icon': 'fas fa-mobile-android-alt',
      'type': 'device',
      'title': 'This device',
      'parentId': null,
      'device': localStorage.deviceId
    });
  }
  for (var i = 0, l = items.length; i < l; i++) {
    var d = items[i];
    if (d.parentId == 'root________') // Used in Firefox
      d.parentId = '0';
    var isFolder = d.dateGroupModified || d.children || typeof d.url == 'undefined' || d.type == 'folder';
    var obj = {
      'dateAdded': d.dateAdded,
      'id': localStorage.deviceId + '|' + d.id,
      'index': d.index,
      'parentId': localStorage.deviceId + '|' + d.parentId,
      'title': d.title,
      'url': d.url,
      'device': localStorage.deviceId
    };
    pushItemToUI(obj);
    if (!localOnly) {
      var alreadyPresent = bookmarksDownloadedFromServer.some(function (item) {
        return item.id == obj.id;
      });
      if (!alreadyPresent)
        await updateRecordOnServer(obj.id, obj, commitInBatch = true);
    }
    if (isFolder && d.children) {
      await pushLocalBookmarksToServer(d.children, localOnly);
    }
  }
  if (batch && batch._mutations.length && !batch._committed) {
    batch.commit();
    batch = db.batch();
  }
  bookmarksToShowInTheUI.sort((a, b) => (a.title.toLowerCase() > b.title.toLowerCase()) ? 1 : -1)
  localStorage.remoteBookmarks = json_encode(bookmarksToShowInTheUI);
}

var pushItemToUI = function (node) {
    if (!createdRoots[node.id.split('|')[0]]) {
      createdRoots[node.id.split('|')[0]] = true;
      if (node.id.split('|')[0] == localStorage.deviceId) {
        bookmarksToShowInTheUI.push({
          'id': localStorage.deviceId + '|0',
          'icon': 'fas fa-mobile-android-alt',
          'type': 'device',
          'title': 'This device',
          'parentId': null,
          'device': localStorage.deviceId
        });
      } else {
        bookmarksToShowInTheUI.push({
          'id': node.id.split('|')[0] + '|0',
          'icon': 'fas fa-mobile-android-alt',
          'type': 'device',
          'title': node.id.split('|')[0],
          'parentId': null
        });
      }
    }
    var alreadyPresent = bookmarksToShowInTheUI.some(function (item) {
      return item.id == node.id;
    });
    if (!alreadyPresent) {
      bookmarksToShowInTheUI.push(node);
    }
}
var getItemById= (edited)=>{
  var indexToEdit = bookmarksToShowInTheUI.map(function (item) {
    return item.id;
  }).indexOf(edited.id);
  bookmarksToShowInTheUI[indexToEdit].title=edited.title;
  bookmarksToShowInTheUI[indexToEdit].url=edited.url;
  return bookmarksToShowInTheUI[indexToEdit];
}
var removeItemFromUI = function (node) {
  var indexToRemove = bookmarksToShowInTheUI.map(function (item) {
    return item.id;
  }).indexOf(node.id);
  bookmarksToShowInTheUI.splice(indexToRemove, 1);
}

var sortBookmarksInTheUI = function () {
  bookmarksToShowInTheUI.sort((a, b) => (a.title.toLowerCase() > b.title.toLowerCase()) ? 1 : -1)
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var db = firebase.firestore();
var bookmarksDownloadedFromServer = [];
var bookmarksToShowInTheUI = [];
var initialSyncDone = false;
var createdRoots = [];
var batch = null;

console.log('Locally load bookmarks');
chrome.bookmarks.getTree(function (tree) {
  pushLocalBookmarksToServer(tree[0].children, localOnly = true);
});
console.log('Local bookmarks loaded');
//Update bookmark on server on locally changed

chrome.bookmarks.onChanged.addListener((i, record) => {
  record.id = localStorage.deviceId + '|' + i;
  var editedRecord = getItemById(record);
  sortBookmarksInTheUI();
  updateRecordOnServer(i, editedRecord);
  localStorage.remoteBookmarks = json_encode(bookmarksToShowInTheUI);
});

//Update bookamark on server on locally created
chrome.bookmarks.onCreated.addListener((i, record) => {
  record.id = localStorage.deviceId + '|' + i;
  record.parentId=localStorage.deviceId + '|' + record.parentId;
  pushItemToUI(record);
  sortBookmarksInTheUI();
  updateRecordOnServer(i, record);
  localStorage.remoteBookmarks = json_encode(bookmarksToShowInTheUI);
});

//Remove bookmark from server on locally removed
chrome.bookmarks.onRemoved.addListener((i, record) => {
  record.id = localStorage.deviceId + '|' + i;
  record.node.id = localStorage.deviceId + '|' + record.node.id;
  removeItemFromUI(record);
  sortBookmarksInTheUI(); 
  deleteRecordOnServer(i, record);
  localStorage.remoteBookmarks = json_encode(bookmarksToShowInTheUI);
});

firebase.auth().onAuthStateChanged(async function (user) {
  console.log('onAuthStateChanged');
  if (user) {
    console.log('Logged-in under UID: ' + user.uid);
    localStorage.uid = user.uid;

    bookmarksDownloadedFromServer = [];
    bookmarksToShowInTheUI = [];
    createdRoots = [];




    console.log('onAuthStateChanged calling base64_string_to_array');
    db.collection('users').doc(localStorage.uid).collection('bookmarks').onSnapshot(async function (querySnapshot) {
      console.log('Receiving query snapshot - ' + querySnapshot.docChanges().length);
      await Promise.all(querySnapshot.docChanges().map(async function (change) {
        var doc = change.doc;
        await decrypt(base64_string_to_array(doc.data().data), base64_string_to_array(localStorage.pkey),
          base64_string_to_array(doc.data().iv), 'AES-CBC').then(function (decryptedNode) {
          decryptedNode = JSON.parse(array_to_string(decryptedNode));
          if (change.type == 'removed') {
            var indexToRemove = bookmarksDownloadedFromServer.map(function (item) {
              return item.id;
            }).indexOf(decryptedNode.id);
            bookmarksDownloadedFromServer.splice(indexToRemove, 1);
            indexToRemove = bookmarksToShowInTheUI.map(function (item) {
              return item.id;
            }).indexOf(decryptedNode.id);
            bookmarksToShowInTheUI.splice(indexToRemove, 1);
            return;
          } else if (change.type == 'added' || change.type == 'modified') {
            var alreadyPresent = bookmarksDownloadedFromServer.some(function (item) {
              return item.id == decryptedNode.id;
            });
            if (alreadyPresent) {
              var indexToRemove = bookmarksDownloadedFromServer.map(function (item) {
                return item.id;
              }).indexOf(decryptedNode.id);
              bookmarksDownloadedFromServer.splice(indexToRemove, 1);
              indexToRemove = bookmarksToShowInTheUI.map(function (item) {
                return item.id;
              }).indexOf(decryptedNode.id);
              bookmarksToShowInTheUI.splice(indexToRemove, 1);
            }
            bookmarksDownloadedFromServer.push(decryptedNode);
            pushItemToUI(decryptedNode);
          }
        });
      }));
      sortBookmarksInTheUI();
      localStorage.remoteBookmarks = json_encode(bookmarksToShowInTheUI);
      console.log('Updated data from server, we have: ' + bookmarksDownloadedFromServer.length + ' records from the server and ' + bookmarksToShowInTheUI.length + ' in the UI');
      if (!initialSyncDone) {
        chrome.bookmarks.getTree(function (tree) {
          pushLocalBookmarksToServer(tree[0].children, localOnly = false);
        });
        console.log('Local bookmarks have been pushed to server as part of the initial sync');
        initialSyncDone = true;
      }
    });
  } else {
    // No user is signed in.
  }
});

async function connect_to_firebase() {
  localStorage.uid = await derive_uid_from_passphrase(localStorage.passphrase);
  localStorage.pkey = await derive_aes_key_from_passphrase(localStorage.passphrase);

  try {
    fetch('https://us-central1-sync-internal.cloudfunctions.net/generateToken?uid=' + encodeURIComponent(localStorage.uid))
      .then(function (response) {
        return response.text();
      }).then(function (answer) {
        var token = answer;
        firebase.auth().signInWithCustomToken(token).catch(function (error) {});
      });
  } catch (err) {
    console.log('Cannot fetch database token');
  }
}

async function main() {
  if (typeof localStorage.passphrase == 'undefined' || !localStorage.passphrase) {
    console.log('First initialization, we are generating a random passphrase');
    localStorage.passphrase = array_to_base64_string(generate_passphrase());
  }

  if (typeof localStorage.deviceId != 'undefined' && localStorage.deviceId && localStorage.deviceId != null) {
    console.log('Device ID identified: ' + localStorage.deviceId);
    await connect_to_firebase();
  } else {
    var waitForDeviceId = setInterval(async function () {
      console.log('Waiting for device id');
      if (typeof localStorage.deviceId != 'undefined' && localStorage.deviceId && localStorage.deviceId != null) {
        await connect_to_firebase();
        clearInterval(waitForDeviceId);
      }
    }, 2000);
  }
}

//Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type == "showOptions") { //Check the request
    chrome.runtime.openOptionsPage(); //Open the settings page 
  }
  if(request.type == "deleteDevice"){
    console.log("Delete device : "+request.value);
    sendResponse({error: false});
  }
  return true;

});
main();