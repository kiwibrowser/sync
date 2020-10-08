//Custom Toast class for notification
function Notif(option) {
    //Configuration
    var el = this;
    el.self = document.querySelector('.toast-message');
    el.message = document.querySelector('.message');
    el.top = option.topPos;
    el.classNames = option.classNames;
    el.autoClose = (typeof option.autoClose === "boolean") ? option.autoClose : false;
    el.autoCloseTimeout = (option.autoClose && typeof option.autoCloseTimeout === "number") ? option.autoCloseTimeout : 3000;
    //Methods
    el.reset = function () {
        (el.message).innerHTML = "";
        el.self.classList.remove(el.classNames);
    }
    el.showN = function (msg, type) {
        el.reset();
        el.message.innerHTML = msg;
        el.self.style.top = el.top;
        el.self.classList.add(type);

        if (el.autoClose) {
            setTimeout(function () {
                el.hideN();
            }, el.autoCloseTimeout);
        }
    }
    el.hideN = function () {
        el.self.style.top = '-100%';
        el.reset();
    };
}
//Initialize a Toast message object 
var notification = new Notif({
    topPos: '200px',
    classNames: 'success',
    autoClose: true,
    autoCloseTimeout: 2000
});
var deleteIcon='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
//Get top folders - Devices folder 
function orphans() {
    return data.filter(function(item) {
      return item.parentId === null;
    });
  }
//Get bookmarks
var data ={};
if (typeof localStorage.remoteBookmarks != 'undefined')
  data = JSON.parse(localStorage.remoteBookmarks);
//Initialize and show devices on option page
const devices_list= document.getElementById("devices-list");
var devices=orphans();//Folders without parent are basically the devices folders
var str='<ul>';

devices.forEach(element => {
    str+='<li><div class="itemInner"><p>'+element.id.split('|')[0]+'</p><i class="removeItemBtn">'+deleteIcon+'</i></div></li>';
});
str+="</ul>";
devices_list.innerHTML=str;
const removeButtons=document.getElementsByClassName("removeItemBtn");
Array.prototype.forEach.call(removeButtons, function(el, i){
    el.onclick=()=>{
        var device=el.parentNode.querySelector('p').innerHTML;
        chrome.runtime.sendMessage({type:"deleteDevice",value:device},function(response) {
            console.log(response);
            if(!response.error){
                notification.showN('Delete is not possible yet !', 'danger');
            }
          });

    }
});
//Get input elements
const input_synckey = document.getElementById("sync-key");
const input_devicename = document.getElementById("device-name");
//Get sync key
var passphrase = localStorage.passphrase;
//Get device name (id)
var deviceId = localStorage.deviceId;

if (typeof localStorage.deviceId == 'undefined') {
    deviceId = "Device-" + Math.random();
}else{
    
    input_devicename.disabled=true;
}




//Function to paste from clipboard
async function pasteFromClip () {
    const text = await navigator.clipboard.readText();
    input_synckey.value = text;
    notification.showN('Sync key has been pasted from clipboard !', 'success');
  }
// Function to copy to clipboard
function copyToClip(str) {
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    const selected =
        document.getSelection().rangeCount > 0 ? document.getSelection().getRangeAt(0) : false;
    el.select();
    document.execCommand('copy');
    el.parentNode.removeChild(el);
    if (selected) {
        document.getSelection().removeAllRanges();
        document.getSelection().addRange(selected);
    }
    notification.showN('Your key has been copied to clipboard !', 'success');
}

// set-up values and initialize listeners
input_devicename.value = deviceId;

input_synckey.value = passphrase;

document.getElementById("copy-key").addEventListener('click', () => {
    copyToClip(passphrase);
});
document.getElementById("save").addEventListener('click', () => {
    save_settings();
});
document.getElementById("paste-key").addEventListener('click', () => {
    pasteFromClip();
});


//Function to save settings( to localstorage)
function save_settings() {
    let key =input_synckey.value.trim();
    if (key.length == 0 || !window.atob(input_synckey.value)) {
        notification.showN('Sync key not valid', 'danger');
        return;
    }
    //Remove white spaces at start/end
    let id = input_devicename.value.trim();
    if (id.length==0) {//Check if device name is not empty
        notification.showN('Invalid device name', 'danger');
        return;
    }
    localStorage.passphrase = input_synckey.value;
    localStorage.deviceId = input_devicename.value;
    notification.showN('Settings saved correctly!', 'success');
}