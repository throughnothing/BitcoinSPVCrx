'use strict';
var PeerManager = require('./peermanager');

/**
 * Listens for the app launching, then creates the window.
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function() {
    var pm = new PeerManager();
    pm.on('syncprogress', function(progress) {
        console.log('syncProgress:', progress, 'height:', pm.syncedHeight());
    });
    pm.on('synccomplete', function() { console.log('syncComplete!'); });
    pm.connect();

    chrome.app.window.create(
      "html/index.html",
      {
        id: "bitcoin-spv-window",
        outerBounds: { minWidth: 800, minHeight: 480 }
      },
      function(window) {
          window.onClosed.addListener(function() {
              pm.disconnect();
              clearInterval(progressInterval);
              console.log('Shut down.');
          });
      }
    );

});

