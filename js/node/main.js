'use strict';
var Pool = require('../bitcoin/pool');
var pool = new Pool(process.env.BTC_NETWORK || 'testnet');
pool.on('syncprogress', function(progress) {
    var height = pool.syncedHeight();
    console.log('syncProgress:', progress, 'height:', height);
});
pool.on('synccomplete', function() { console.log('syncComplete!'); });
pool.connect();
console.log('network:', pool.network.name);

