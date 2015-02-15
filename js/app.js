'use strict';

function onSyncProgress(request) {
  console.log('sync progress:', request.progress, request.height);
}

function onSyncComplete(request) {
  console.log('sync complete!');
}

function onUpdatePeers(request, action) {
  console.log(action, ' -- numPeers:', request.numPeers);
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if(sender.tab) {
    console.log('Message from self, ignoring');
    return;
  }

  switch(request.type) {
    case 'syncprogress':
      onSyncProgress(request);
      break;
    case 'synccomplete':
      onSyncComplete(request);
      break;
    case 'peerconnect':
      onUpdatePeers(request, 'connect');
      break;
    case 'peerdisconnect':
      onUpdatePeers(request, 'disconnect');
      break;
    default:
      break;
  }
});
