'use strict';
var Pool = require('../bitcoin/pool');
// TODO: include the wallet here as well


/**
 * Listens for the app launching, then creates the window.
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function() {
  var pool = new Pool();
  Pool.Events.forEach(function(eventName) {
    pool.on(eventName, function() {
      chrome.runtime.sendMessage({
        pool: pool,
        type: eventName,
        arguments: arguments
      });
    });
  });

  pool.connect();

  chrome.app.window.create(
    "index.html",
    {
      id: "bitcoin-spv-window",
      outerBounds: { minWidth: 400, minHeight: 600 },
      innerBounds: { maxWidth: 500, maxHeight: 700 },
      frame: { type: 'chrome' }
    },
    function(window) {
      window.onClosed.addListener(function() {
        pool.disconnect();
        console.log('Shut down.');
      });
    }
  );

});

//TODO: is there a better way to check the sender?
var isSelf = /background_page.html/;
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if(isSelf.test(sender.url)){
    return;
  }
  //TODO: background.js dispatcher
  console.log('background.js message:', request);
  switch(request.type) {
    default:
      break;
  }
});
