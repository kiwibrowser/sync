// The flow for encryption is the following:
//
// Using a user-provided passphrase, we derive:
// 1) Username
// 2) Private KEY (to encrypt user data using AES)
//
// To derive the key, we use PBKDF2 with 100'000 iterations, and we have to provide one salt for generating the UID, and one salt for generating the private key
//
// These values have been generated with crypto.getRandomValues(new Uint8Array(64))
// You can change these default values to anything you want, as long as they are the same on all your devices
//
var cryptoSalts = {
  uid: new Uint8Array([24,206,116,1,83,177,137,240,230,23,3,115,219,61,204,42,4,221,44,25,37,160,227,35,162,58,120,149,8,58,242,25,181,94,46,255,2,225,80,143,158,88,144,191,216,184,65,46,86,233,148,52,99,215,133,222,195,228,44,91,156,107,212,165]),
  pkey: new Uint8Array([34,79,240,56,71,26,229,251,174,181,58,13,99,174,22,7,72,234,170,21,242,31,61,165,9,52,183,102,113,140,18,25,174,67,172,74,247,227,226,10,23,205,176,56,219,81,31,4,174,142,68,186,235,140,103,88,64,192,91,77,223,243,250,176])
};

var crypto = window.crypto || window.msCrypto;

// Encrypt
const encrypt = (data, key, iv, mode) =>
  crypto.subtle.importKey('raw', key, { name: mode }, true, ['encrypt'])
  .then(bufKey => crypto.subtle.encrypt({ name: mode, iv }, bufKey, data))

// Decrypt
const decrypt = (data, key, iv, mode) =>
  crypto.subtle.importKey('raw', key, { name: mode }, true, ['decrypt'])
  .then(bufKey => crypto.subtle.decrypt({ name: mode, iv }, bufKey, data))

// PBKDF2 - Derive an encryption key from a password
const pbkdf2 = (password, salt, iterations, hash, mode) =>
  crypto.subtle.importKey('raw', password, { name: 'PBKDF2' }, false, ['deriveKey'])
  .then(baseKey => crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash }, baseKey, { 'name': mode, 'length': 256 }, true, ['encrypt', 'decrypt']))
  .then(key => crypto.subtle.exportKey('raw', key))

function generate_passphrase() {
  return crypto.getRandomValues(new Uint8Array(64));
}

async function derive_uid_from_passphrase(passphrase) {
  var uid = await pbkdf2(base64_string_to_array(passphrase), cryptoSalts.uid, iterations = 100000, hash = 'SHA-512', mode = 'AES-CBC');

  // We store data in our folder, we cannot have a folder containing a slash so we swap it with a pipe instead
  return array_to_base64_string(uid).replace(/\//g, '|');
}

async function derive_aes_key_from_passphrase(passphrase) {
  var pkey = await pbkdf2(base64_string_to_array(passphrase), cryptoSalts.pkey, iterations = 100000, hash = 'SHA-512', mode = 'AES-CBC');

  return array_to_base64_string(pkey);
}
