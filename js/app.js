'use strict';
var PeerManager = require('./peermanager');
var pm = new PeerManager();
pm.connect();

setInterval(function(){
    console.log('syncProgress:', pm.syncProgress());
}, 2000);
