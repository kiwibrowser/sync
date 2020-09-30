// Here we could use JSON.stringify, but there is an issue:
// https://bugs.chromium.org/p/v8/issues/detail?id=855
// So we wrap the function in case we'll need workaround later
function json_encode(obj) {
  return JSON.stringify(obj);
}

function array_to_string(buffer) {
  return new TextDecoder("utf-8").decode(buffer);
}

function string_to_array(str) {
  return new TextEncoder("utf-8").encode(str);
}

function array_to_base64_string(buffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64_string_to_array(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}
