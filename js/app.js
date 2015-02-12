'use strict';
var bitcorep2p = require('bitcore-p2p');

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
//pool.disconnect()
