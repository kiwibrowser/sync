const request = require('request');
const admin = require('firebase-admin');
admin.initializeApp();

const functions = require('firebase-functions');

exports.generateToken = functions.https.onRequest(async (req, res) => {
  var uid = req.query.uid || req.body.uid;
  res.set('Content-Type', 'application/json');
  res.set('Access-Control-Allow-Origin', '*');
  await admin.auth().createCustomToken(uid)
  .then(function(customToken) {

    // var text = '[Login] A new database access token has been assigned to: ' + uid;

    res.status(200).send(customToken);
  })
  .catch(function(error) {
    console.log('Error creating custom token:', error);
    res.status(500).send("Error creating token");
  });
});
