Kiwi Sync
Open-source Chrome Extension for Bookmarks and Profile sync

Copyright 2020 Geometry OU / Kiwi Browser

Licensed under GPL

![cloud sync](https://cloud.google.com/images/firestore/sync-data-across-devices.png)

Kiwi Sync will appear on the top right of your address bar.
To invoke Kiwi Sync, press CTRL-Shift-F (on Windows), or CTRL-F (on MacOS) and Kiwi Sync will search accross all your bookmarks very, very, very fast (faster than Chrome).

What's implemented:
  - A blazingly fast way to search local and remote bookmarks
  - Live synchronisation of bookmarks across multiple devices
  - Offline synchronisation (you can add bookmarks while offline, and come back few minutes or days later).
  - Strong cryptography
  - Cross-browser support
  - Keyboard shortcut
  - Keyboard navigation with arrows

WARNING: THIS EXTENSION IS IN DEVELOPMENT:
==
  This is an extension that will send your bookmarks to a private folder created specifically for you on a public server.

  The bookmarks are encrypted, and there is strong encryption (heh! there's a challenge for you to break it!).

  There are NO KNOWN WAYS to decrypt user data.
  However:
  This extension is in DEVELOPMENT and provided WITHOUT ANY GUARANTEE. It is NOT recommended to use it.
  The bookmarks you are syncing may be LEAKED. Do not sync secrets.
  Do not use it in a profile where your bookmarks are secret until it is thoroughly tested
  or if you are not ready to accept to lose your local bookmarks in case of a bug.

What's missing:
  - [x] Mobile UI (to use inside Kiwi!) 
  - [x] UI to add a new device
  - [ ] UI to remove a device
  - [ ] UI to delete data from the server
  - [ ] UI to choose the Firebase server where to sync to (for users who want to host their own instance)
  - [ ] A reverse proxy for Chinese users to be able to access Firestore from China

Precepts:
  - Sync server *can* be compromised, and this should *not* impact user privacy.
  - The user should not have to trust the Sync server.
  - Users prefers to be anonymous (avoid Google SSO for example).

The main concept:
  - Each user generates a 32 bytes user ID {userId} derived from a passphrase provided by the user.
  - Sync server allocates one folder to each user.
  - All devices belonging to {userId} can access /users/{userId} and be informed when changes are happening.

Flow:
  - User enters a passphrase (e.g. 12 seed words), from this passphrase, using PBKDF2 (SHA-512, 100 000 iterations) is derived an AES-256 CBC secret key* {secretKey} and one username {userId} using window.crypto.subtle.deriveKey.
  - To access Google Cloud Firestore, device requests a database session token at https://us-central1-sync-internal.cloudfunctions.net/generateToken?uid={userId}
  - Device is assigned a folder /users/{userId}/bookmarks in Google Cloud Firestore.
  - Every time a bookmark is created, updated or removed on a device, the device publishes the change to /users/{userId}/bookmarks/{deviceId}|{bookmarkId}
  - Other devices listen to changes using onSnapshot


*To confirm which mode of operation AES is the most appropriate

Arnaud.
