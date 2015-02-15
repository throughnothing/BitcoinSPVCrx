'use strict';
var PeerManager = require('./peermanager');
var pm = new PeerManager();
pm.on('syncing', function(pm) {
    var syncUpdate = setInterval(function(){
        var progress = pm.syncProgress();
        var height = pm.syncedHeight();
        console.log('syncProgress:', progress, 'height:', height);
        if(progress >= 1) {
            clearInterval(syncUpdate);
        }
    }, 2000);

});
pm.connect();

