# sync
Open-source Chrome Extension for Bookmarks and Profile sync

Copyright 2019 Geometry OU / Kiwi Browser

Licensed under GPL

The main concept:
  - Each user gets an anonymous user ID derived from a passphrase provided by the user.
  - Sync server allocates one folder to each user.
  - All devices can access folders of one user and be informed when changes are happening.

Flow:
  - User enters a passphrase (e.g. 12 seed words), from this passphrase, using PBKDF2 (SHA-512, 100 000 iterations) is derived an AES-256 CBC secret key* and one username (non-secret) using window.crypto.subtle.deriveKey.
  - Device is assigned a folder /bookmarks/{userID}/{deviceId}/ in Google Cloud Firestore.
  - To access Google Cloud Firestore, device requests a database session token at https://us-central1-sync-internal.cloudfunctions.net/generateToken?uid=
  - Device publishes bookmarks changes to its folder
  - Other devices listen to changes using onSnapshot

* To be confirmed

Arnaud.
