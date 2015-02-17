'use strict';
var PeerManager = require('../js/peermanager');
var pm = new PeerManager(process.env.BTC_NETWORK || 'testnet');
pm.on('syncprogress', function(progress) {
    var height = pm.syncedHeight();
    console.log('syncProgress:', progress, 'height:', height);
});
pm.on('synccomplete', function() { console.log('syncComplete!'); });
pm.connect();
console.log('network:', pm.network.name);

