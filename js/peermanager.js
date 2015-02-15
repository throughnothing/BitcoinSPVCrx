'use strict';
var bitcorep2p = require('bitcore-p2p'),
    Pool = bitcorep2p.Pool,
    Messages = bitcorep2p.Messages,
    bitcore = require('bitcore'),
    BlockHeader = bitcore.BlockHeader,
    bufferUtil = bitcore.util.buffer,
    EventEmitter = require('events').EventEmitter,
    util = require('util');


// Breadwallet uses 3, so that's good enough for us?!
Pool.MaxConnectedPeers = 3;
var MAX_GETDATA_HASHES = 50000;
// Random checkpoitns to use, most of these from Breadwallet BRPeerManager.m
var CHECKPOINTS = [
    [      0, "000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943" ],
    [  20160, "000000001cf5440e7c9ae69f655759b17a32aad141896defd55bb895b7cfc44e" ],
    [  40320, "000000008011f56b8c92ff27fb502df5723171c5374673670ef0eee3696aee6d" ],
    [  60480, "00000000130f90cda6a43048a58788c0a5c75fa3c32d38f788458eb8f6952cee" ],
    [  80640, "00000000002d0a8b51a9c028918db3068f976e3373d586f08201a4449619731c" ],
    [ 100800, "0000000000a33112f86f3f7b0aa590cb4949b84c2d9c673e9e303257b3be9000" ],
    [ 120960, "00000000003367e56e7f08fdd13b85bbb31c5bace2f8ca2b0000904d84960d0c" ],
    [ 141120, "0000000007da2f551c3acd00e34cc389a4c6b6b3fad0e4e67907ad4c7ed6ab9f" ],
    [ 161280, "0000000001d1b79a1aec5702aaa39bad593980dfe26799697085206ef9513486" ],
    [ 181440, "00000000002bb4563a0ec21dc4136b37dcd1b9d577a75a695c8dd0b861e1307e" ],
    [ 200000, "000000000000034a7dedef4a161fa058a2d67a173a90155f3a2fe6fc132e0ebf" ], // Custom
    [ 201600, "0000000000376bb71314321c45de3015fe958543afcbada242a3b1b072498e38" ],
    [ 250000, "000000000000003887df1f29024b06fc2200b55f8af8f35453d7be294df2d214" ], // Custom
    [ 300000, "000000000000000082ccf8f1557c5d40b21edabb18d2d691cfbf87118bac7254" ], // Custom
];
// TODO: base this on wallet start time (?)
var STARTING_CHECKPOINT = CHECKPOINTS[13];


function PeerManager() {
    this.connected = false;
    this.pool = null;
    this.peers = [];
    this.downloadPeer = null;
    this.knownBlockHashes = [];
    // TODO: Store this somewhere better
    this.blocks = [];

    this._bestHeight = 0;
}

util.inherits(PeerManager, EventEmitter);

PeerManager.prototype.connect = function() {
    var self = this;
    if(self.connected) return;

    self.pool = new Pool();
    self.pool.on('peerconnect', self.peerConnected.bind(this));
    self.pool.on('peerready', self.peerReady.bind(this));
    self.pool.on('peerdisconnect', self.peerDisconnected.bind(this));
    self.pool.on('peerheaders', self.peerHeaders.bind(this));
    self.pool.on('peerinv', self.peerInv.bind(this));
    self.pool.on('peertx', self.peerTx.bind(this));
    self.pool.on('peererror', self.peerError.bind(this));

    self.pool.connect();
    self.connected = true;
    
    // TODO: figure out why this is needed
    var readyTo = setTimeout(function(){
        console.log('pool reconnecting');
        self.disconnect();
        self.connect();
    },3000);
    self.pool.once('peerready', function() { clearTimeout(readyTo); });
}

PeerManager.prototype.peerConnected = function(peer) {
    var self = this;
    console.log('peerConnected');
    self.peers.push(peer);

    // Only wait 2 seconds for verAck
    var peerTimeout = setTimeout(function() {
        console.log('peer timed out, disconnecting');
        peer.disconnect();
    },2000);
    // Clear timeout once peer is ready
    peer.on('ready', function() { clearTimeout(peerTimeout); });
    self.emit('peerconnect', self.peers.length)
}

PeerManager.prototype.peerReady = function(peer, addr) {
    var self = this;

    self._bestHeight = Math.max(self._bestHeight, peer.bestHeight);
    console.log('peerReady: ', addr.ip.v4);
    //TODO: Smarter peerDownload detection
    if(!self.downloadPeer) {
        self._setDownloadPeer(peer);
    } else {
        // Check if the new peer has a higher height, and switch
        // downloadPeer, if so
        if(peer.bestHeight > self.downloadPeer.bestHeight) {
            console.log('switching downloadPeer');
            self.downloadPeer.disconnect();
            self._setDownloadPeer(peer);
        }
    }
}

PeerManager.prototype.peerDisconnected = function(peer, addr) {
    var self = this;
    console.log('removing:', addr.ip.v4);
    var idx = self.peers.indexOf(peer);
    if(idx && self.peers[idx] == self.downloadPeer){
        console.log('unsetting downloadPeer');
        // TODO: is this good enough, or do we need to re-set it here?
        self.downloadPeer = null;
    }
    self.peers.splice(idx-1,1);
    self.emit('peerdisconnect', self.peers.length)
}

PeerManager.prototype.peerInv = function(peer, message) {
    var self = this;
    var txHashes = [], blockHashes = [];

    if(message.count > MAX_GETDATA_HASHES) {
        console.log('inv message has too many items, dropping.');
        return;
    }

    for(var i in message.inventory) {
        switch(message.inventory[i].type) {
            case 1: // TX
                txHashes.push(message.inventory[i]);
                break;
            case 2: // Block
                blockHashes.push(message.inventory[i]);
                break;
            default: break;
        }
    }

    // TODO: Check for bloom filter

    // Stole this logic from breadWallet
    if(txHashes.length > 10000) {
        console.log('too many transactions, disconnecting from peer');
        peer.disconnect();
        return;
    }

    if(blockHashes.length == 1 &&
            self.knownBlockHashes.indexOf(blockHashes[0].toString('hex')) > -1) {
        console.log('already had latest block, ignoring');
        blockHashes = [];
    }
    if(blockHashes.length == 1) {
        self.knownBlockHashes.push(blockHashes[0]);
        console.log('got new block!', blockHashes[0]);
        self.emit('syncstarted', self);
        peer.sendMessage(
            new Messages.GetHeaders([self.getLatestBlockHash()]));
    }
}

PeerManager.prototype.peerTx = function(peer, message) {
    console.log('peertx', message);
}

PeerManager.prototype.peerError = function(peer, e) {
    console.log('peererror', e);
    peer.disconnect();
}

PeerManager.prototype.peerHeaders = function(peer, message) {
    var self = this;
    console.log('headers response');
    for(var i in message.headers) {
        var blockHeader = new BlockHeader(message.headers[i]);
        // TODO: This won't handle chain forks, it'll just accept the first
        // valid proof on top of the current chain.  It won't be able to find
        // another chain that grows longer than the first one seen.
        if(blockHeader.validProofOfWork()) {
            var prevHash = bufferUtil.reverse(blockHeader.prevHash).toString('hex');
            if(!self.blocks.length && blockHeader.hash) {
                // First block
                self.blocks.push(blockHeader.hash);
            } else if (prevHash == self.getLatestBlockHash()) {
                self.blocks.push(blockHeader.hash);
            } else {
                // TODO: do something better here?
                //console.log('block didnt go on chain');
            }
            var syncedHeight = self.syncedHeight();
            if(syncedHeight > self.bestHeight) {
                self.bestHeight = syncedHeight;
            }
        }
    }

    self.emit('syncprogress', self.syncProgress());
    // If we still have more messages to get
    if(self.syncedHeight() < self.estimatedBlockHeight()) {
        //console.log('getting more headers');
        var lastHeader = message.headers[message.headers.length - 1];
        peer.sendMessage(new Messages.GetHeaders([lastHeader.id]));
    } else {
        self.emit('synccomplete', self);
    }
}

PeerManager.prototype.disconnect = function() {
    this.connected=false;
    this.pool.disconnect();
}

PeerManager.prototype.syncProgress = function() {
    var self = this;
    //TODO: this is really crude and crappy atm
    return self.blocks.length /
        (self.estimatedBlockHeight() - STARTING_CHECKPOINT[0])
}

PeerManager.prototype.estimatedBlockHeight = function() {
    var self = this;
    if(!self.downloadPeer) {
        return 0;
    }
    return Math.max(self._bestHeight, self.syncedHeight());
}

PeerManager.prototype.syncedHeight = function() {
    var self = this;
    return STARTING_CHECKPOINT[0] + self.blocks.length;
}

PeerManager.prototype.bestHeight = function() {
    var self = this;
    return Math.max(self.syncedHeight(), self._bestHeight)
}

PeerManager.prototype.getLatestBlockHash = function() {
    var self = this;
    return self.blocks[self.blocks.length -1]
}

PeerManager.prototype.timestampForBlockHeight = function(blockHeight) {
    var self = this;
    // TODO:
    //if (blockHeight > self.syncedBlockHeight()) {
        //// future block, assume 10 minutes per block after last block
        //return self.lastBlock.timestamp + (blockHeight - self.lastBlockHeight)*10*60;
    //}
}

PeerManager.prototype._setDownloadPeer = function(peer) {
    var self = this;
    self.emit('syncstarted', self);
    self.downloadPeer = peer;
    // TODO: For now we always just start with startingBlock, fix that
    peer.sendMessage( new Messages.GetHeaders([STARTING_CHECKPOINT[1]]) );
}


module.exports = PeerManager;
