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

//Event listener for button to open settings page
let btt = document.querySelector("#settings-icon");
btt.addEventListener("click", () => {
    chrome.runtime.sendMessage("showOptions");
});


function currently_selected_elem(){
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
const folderIcon = '<svg class="fld-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>';
function generateListItem(query, item) {
  const li = document.createElement('li');
  li.id = 'item-' + item.id;
  li.tabIndex = 0;
  const a = document.createElement('a');
  if (hasChildren(item.id)) {//Check if it's a bookmark ( Check One)
    a.href = '#';
    a.tabIndex = -1;
    a.classList.add('fld-label');
    a.addEventListener('click', expand);
    li.appendChild(a);
  }
  
  itemlabeltext = document.createTextNode(item.title);
  sanitizedtext = itemlabeltext.nodeValue;
  if (query && query.length > 0) {
    var queryx = query.split(' ');
    for (var i = 0; i < queryx.length; i++)
      queryx[i] = queryx[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var reg = new RegExp(queryx.join('|'), 'gi');
    sanitizedtext = sanitizedtext.replace(reg, '<b>$&</b>');
  }
  if (item.device && item.device != localStorage.deviceId && document.getElementById('searchField').value)
    sanitizedtext += ' <span class="source">' + item.device + '</span>';
  
  if (item.url) {//Check if it's a bookmark (Check Two)
    const itemlink = document.createElement('a');
    itemlink.classList="item-label";
    itemlink.href = item.url;
    itemlink.target = '_blank';
    itemlink.innerHTML = ' ' + sanitizedtext;
    li.appendChild(itemlink);
  } else {
    a.innerHTML = folderIcon+sanitizedtext;
  }
  
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


