# sync
Open-source Chrome Extension for Bookmarks and Profile sync

Copyright 2019 Geometry OU / Kiwi Browser

Licensed under GPL

The main concept:
  - Each user generates a 32 bytes user ID {userId} derived from a passphrase provided by the user.
  - Sync server allocates one folder to each user.
  - All devices belonging to {userId} can access /bookmarks/{userId} and be informed when changes are happening.

Flow:
  - User enters a passphrase (e.g. 12 seed words), from this passphrase, using PBKDF2 (SHA-512, 100 000 iterations) is derived an AES-256 CBC secret key* {secretKey} and one username {userId} using window.crypto.subtle.deriveKey.
  - To access Google Cloud Firestore, device requests a database session token at https://us-central1-sync-internal.cloudfunctions.net/generateToken?uid={userId}
  - Device is assigned a folder /bookmarks/{userId}/{deviceId}/ in Google Cloud Firestore.
  - Every time a bookmark is created, updated or removed on a device, the device publishes the change to /bookmarks/{userId}/{deviceId}/{bookmarkID}
  - Other devices listen to changes using onSnapshot


*To confirm which mode of operation AES is the most appropriate

Arnaud.
