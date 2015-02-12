'use strict';
var bitcorep2p = require('bitcore-p2p');

/**
 * Listens for the app launching, then creates the window.
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function() {
    bitcorep2p.Pool.MaxConnectedPeers = 3;
    var pool = new bitcorep2p.Pool();

    pool.on('seed', function(ips) { console.log('seed! '); });
    pool.on('seederror', function(err) { console.log('seederror ', err); });

    var peers = {};

    pool.on('peerready', function(peer, addr) {
        console.log('adding', addr.hash);
        peers[addr.hash] = peer;
    });
    pool.on('peertx', function(peer, message) { console.log('peertx: ', peer, ', Message: ', message); });
    pool.on('peeraddrdisconnect', function(peer, addr) {
        console.log('removing', addr.hash);
        peers.remove(addr.hash);
    });

    pool.on('peerping', function(peer, message) { console.log('peeraddr: ', peer, ', Message: ', message); });

    pool.connect();

    setTimeout(function(){
        console.log('numConnected: ', pool.numberConnected());
    },3000);

    chrome.app.window.create(
      "html/index.html",
      {
        id: "bitcoin-spv-window",
        outerBounds: { minWidth: 800, minHeight: 480 }
      },
      function(window) {
          window.onClosed.addListener(function() {
              pool.disconnect();
              console.log('Shut down.');
          });
      }
    );

});

