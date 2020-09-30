
document.getElementById('add_new_device_button').addEventListener('click', function (e) {
    var generated_html = '';
    generated_html += '<h3>To sync a new device enter the same key on all the devices:</h3>Your current key is: ';
    generated_html += '<div style="width: 200px; padding: 3px; border: 2px dotted; word-break: break-all;"><i>' + localStorage.passphrase + '</i></div>';
  //  generated_html += '<br /><input type="button" id="action_key" value="Enter a new key" style="font-size: 28px; font-weight: bold;" />';
    document.getElementById('content').innerHTML = generated_html;
    alert('You are about to share bookmarks and tabs with other devices');
    var passphrase = prompt("Copy-paste the same key on all your devices", localStorage.passphrase);
    if (passphrase == null || !window.atob(passphrase))
    {
      alert('Incorrect key');
      return;
    }
    localStorage.passphrase = passphrase;
    var default_devicename = "Device-" + Math.random();
    if (typeof localStorage.deviceId != 'undefined')
      default_devicename = localStorage.deviceId;
    var deviceid = prompt("Enter device name", default_devicename);
    if (deviceid == null)
    {
      alert('Incorrect device name');
      return;
    }
    localStorage.deviceId = deviceid;
  });