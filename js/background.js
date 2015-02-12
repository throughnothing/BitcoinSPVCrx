'use strict';
var pm = require('./peermanager');

/**
 * Listens for the app launching, then creates the window.
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function() {
    pm.run();

    chrome.app.window.create(
      "html/index.html",
      {
        id: "bitcoin-spv-window",
        outerBounds: { minWidth: 800, minHeight: 480 }
      },
      function(window) {
          window.onClosed.addListener(function() {
              pm.stop();
              console.log('Shut down.');
          });
      }
    );

});

