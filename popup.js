/* data is in flat array format like this:
[
  {
    id: 'abc',
    name: 'ABCDE',
    parent: null
  },
  {
    id: 'def',
    name: 'DEFGH',
    parent: 'abc'
  }
]
*/

console.log('Initializing popup');
var selected = 0;
var data = [];

function currently_selected_elem()
{
  return document.querySelector('li.selected');
}

function orphans() {
  return data.filter(function(item) {
    return item.parentId === null;
  });
}

function getItemsByText(query) {
  var queryx = query.split(' ');
  return data.filter(function(item) {
    const src = item.title.toString().toLowerCase();
    for (var i = 0; i < queryx.length; i++) {
      if (!src.includes(queryx[i].toString().toLowerCase())) {
        return false;        
      }
    }
    return true;
  });
}

function hasChildren(parentId) {
  return data.some(function(item) {
    return item.parentId === parentId;
  });
}

function getChildren(parentId) {
  return data.filter(function(item) {
    return item.parentId === parentId;
  });
}

function generateListItem(query, item) {
  const li = document.createElement('li');
  li.id = 'item-' + item.id;
  li.tabIndex = 0;
  if (hasChildren(item.id)) {
    const a = document.createElement('a');
    a.href = '#';
    a.tabIndex = -1;
    a.textContent = '+';
    a.classList.add('plus');
    a.addEventListener('click', expand);
    li.appendChild(a);
  }
  const span = document.createElement('span');
  itemlabeltext = document.createTextNode(item.title);
  sanitizedtext = itemlabeltext.nodeValue;
  if (query && query.length > 0) {
    var queryx = query.split(' ');
    for (var i = 0; i < queryx.length; i++)
      queryx[i] = queryx[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var reg = new RegExp(queryx.join('|'), 'gi');
    sanitizedtext = sanitizedtext.replace(reg, '<b>$&</b>');
  }
  itemlabel = document.createElement('span');
  if (item.device && item.device != localStorage.deviceId && document.getElementById('searchField').value)
    sanitizedtext += ' <span class="source">' + item.device + '</span>';
  itemlabel.innerHTML = ' ' + sanitizedtext;
  if (item.url) {
    const itemlink = document.createElement('a');
    itemlink.href = item.url;
    itemlink.target = '_blank';
    itemlink.appendChild(itemlabel);
    span.appendChild(itemlink);
  } else {
    span.appendChild(itemlabel);
  }
  li.appendChild(span);
  return li;
}

function expand(event) {
  console.time('expand');
  event.preventDefault();
  event.stopPropagation();
  const et = event.target,
        parent = et.parentElement,
        id = parent.id.replace('item-', ''),
        kids = getChildren(id),
        items = kids.map(generateListItem.bind(null, '')),
        ul = document.createElement('ul');
  var hasSelected = false;
  items.some(function(li) {
    if (!hasSelected) {
      if (currently_selected_elem()) {
        var curNode = currently_selected_elem();
        curNode.classList.remove('selected');
      }
      li.classList.add('selected');
      hasSelected = true;
    }
    ul.appendChild(li);
  });
  parent.appendChild(ul);
  et.classList.remove('plus');
  et.classList.add('minus');
  et.textContent = '-';
  et.removeEventListener('click', expand);
  et.addEventListener('click', collapse);
  console.timeEnd('expand');
}

function collapse(event) {
  console.time('collapse');
  event.preventDefault();
  event.stopPropagation();
  const et = event.target,
        parent = et.parentElement,
        ul = parent.querySelector('ul');        
  parent.removeChild(ul);
  et.classList.remove('minus');
  et.classList.add('plus');
  et.textContent = '+';
  et.removeEventListener('click', collapse);
  et.addEventListener('click', expand);
  if (currently_selected_elem()) {
    var curNode = currently_selected_elem();
    curNode.classList.remove('selected');
  }
  et.parentNode.classList.add('selected');
  console.timeEnd('collapse');
}

function addRemotebookmarks() {
  const root = document.getElementById('root'),
        orphansArray = orphans();
  console.log(orphansArray);
  root.innerHTML = '';
  if (orphansArray.length) {
    const items = orphansArray.map(generateListItem.bind(null, '')),
          ul = document.createElement('ul');
    ul.id = 'rootList';
    items.some(function(li) {
      ul.appendChild(li);
    });
    root.appendChild(ul);
  }
}

function searchItem(query) {
  if (!query) {
    addRemotebookmarks();
    return;
  }
  const root = document.getElementById('root');
  resultsArray = getItemsByText(query);
  root.innerHTML = '';
  if (resultsArray.length) {
    const items = resultsArray.map(generateListItem.bind(null, query)),
          ul = document.createElement('ul');
    ul.id = 'rootList';
    var hasSelected = false;
    var nresults = 0;
    // We use some as an alternative to forEach and use return as an early-break
    items.some(function(li) {
      if (!hasSelected) {
        if (currently_selected_elem()) {
          var curNode = currently_selected_elem();
          curNode.classList.remove('selected');
        }
        li.classList.add('selected');
        hasSelected = true;
      }
      ul.appendChild(li);
      if (nresults++ > 100)
        return true;
    });
    root.appendChild(ul);
  }
}

function process_key(e)
{
  var list = document.getElementById('rootList');
  if (!list)
    return false;
  var first = list.firstChild;
  if (!first)
    return false;
  var maininput = document.getElementById('searchField');
  console.log('Pressed: ' + e.keyCode);
  if (e.keyCode == 38) { // up
     e.preventDefault();
     if (currently_selected_elem()) {
       var curNode = currently_selected_elem();
       if (currently_selected_elem().previousSibling)
         currently_selected_elem().previousSibling.classList.add('selected');
       else if (currently_selected_elem() && currently_selected_elem().parentNode.tagName == 'UL' && currently_selected_elem().parentNode.parentNode.tagName == 'LI')
         currently_selected_elem().parentNode.parentNode.classList.add('selected');
       else
         maininput.focus();
       curNode.classList.remove('selected');
     }
     return true;
  }
  else if (e.keyCode == 40) { // down
     e.preventDefault();
     if (currently_selected_elem()) {
       var curNode = currently_selected_elem();
       if (currently_selected_elem().nextSibling)
         currently_selected_elem().nextSibling.classList.add('selected');
       curNode.classList.remove('selected');
     } else {
       first.classList.add('selected');
     }
     return true;
  }
  else if (e.keyCode == 13) { // enter
     e.preventDefault();
     if (currently_selected_elem()) {
       document.querySelector('li.selected a').click();
     }
     return true;
  }
  else if (e.keyCode == 39) { // right
     e.preventDefault();
     if (currently_selected_elem() && document.querySelector('li.selected a') && document.querySelector('li.selected a').classList.contains('plus')) {
       document.querySelector('li.selected a').click();
     } else if (currently_selected_elem() && document.querySelector('li.selected a') && document.querySelector('li.selected a').classList.contains('minus')) {
       var curNode = currently_selected_elem();
       document.querySelector('li.selected ul>li').classList.add('selected');
       curNode.classList.remove('selected');
     }
     return true;
  }
  else if (e.keyCode == 37) { // left
     e.preventDefault();
     if (currently_selected_elem() && document.querySelector('li.selected a') && document.querySelector('li.selected a').classList.contains('minus')) {
       document.querySelector('li.selected a').click();
     }
     else if (currently_selected_elem() && currently_selected_elem().parentNode.tagName == 'UL' && currently_selected_elem().parentNode.parentNode.tagName == 'LI'
           && currently_selected_elem().parentNode.parentNode.firstChild.classList.contains('minus')) {
       currently_selected_elem().parentNode.parentNode.firstChild.click();
     }
     return true;
  }
  return false;
}

console.log('Loading popup');

if (typeof localStorage.remoteBookmarks != 'undefined')
  data = JSON.parse(localStorage.remoteBookmarks);
addRemotebookmarks();

document.getElementById('root').addEventListener('keydown', function (e) {
  process_key(e);
});

document.getElementById('searchField').addEventListener('keyup', function (e) {
  if (!process_key(e))
    searchItem(document.getElementById('searchField').value);
});

document.getElementById('searchField').addEventListener('keydown', function (e) {
  if (currently_selected_elem() && (e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40)) { // ignore up and down keys
    e.preventDefault();
    return false;
  }
});

document.getElementById('add_new_device_button').addEventListener('click', function (e) {
  var generated_html = '';
  generated_html += '<h3>To sync a new device enter the same key on all the devices:</h3>Your current key is: ';
  generated_html += '<div style="width: 200px; padding: 3px; border: 2px dotted; word-break: break-all;"><i>' + localStorage.passphrase + '</i></div>';
//  generated_html += '<br /><input type="button" id="action_key" value="Enter a new key" style="font-size: 28px; font-weight: bold;" />';
  document.getElementById('root').innerHTML = generated_html;
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