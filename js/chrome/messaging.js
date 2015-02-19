'use strict';
var EventEmitter = require('events').EventEmitter,
    util = require('util');


function backgroundSend(type, body) {
  console.log('sending type:', type, 'body:', body);
  chrome.runtime.sendMessage({type: type, body: arguments });
}

function BackgroundEmitter() { }
util.inherits(BackgroundEmitter, EventEmitter);
var backgroundEmitter = new BackgroundEmitter();


var isSelf = /index.html/;
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if(isSelf.test(sender.url)){
    // Ignore Messages from self
    return;
  }
  console.log(request.type, request.arguments);
  // See js/chrome/background.js for list of emitted event types
  backgroundEmitter.emit(request.type, request)
});

module.exports = {
  backgroundEmitter: backgroundEmitter,
  backgroundSend: backgroundSend
}
