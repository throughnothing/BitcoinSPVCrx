'use strict';
var bitcorep2p = require('bitcore-p2p'),
    Pool = bitcorep2p.Pool,
    Messages = bitcorep2p.Messages,
    bitcore = require('bitcore'),
    BlockHeader = bitcore.BlockHeader,
    bufferUtil = bitcore.util.buffer,
    EventEmitter = require('events').EventEmitter;


// from: https://github.com/voisine/breadwallet/blob/master/BreadWallet/BRPeerManager.m
//var genesisBlockHash = "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f";
// TODO: For now, use arbitrary block 343000 as starting point
var STARTING_BLOCK_HEIGHT = 330000;
var STARTING_BLOCK_HASH = "00000000000000000faabab19f17c0178c754dbed023e6c871dcaf74159c5f02"
// Breadwallet uses 3, so that's good enough for us?!
Pool.MaxConnectedPeers = 3;


function PeerManager() {
    this.connected = false;
    // last block height reported by current download peer
    this.pool = null;
    this.peers = [];
    this.downloadPeer = null;
    this._bestHeight = 0;

    // TODO: Store this somewhere better
    this.knownBlockHashes = [];
}

PeerManager.prototype.connect = function() {
    var self = this;

    self.pool = new Pool();
    self.pool.on('peerconnect', self.peerConnected.bind(this));
    self.pool.on('peerready', self.peerReady.bind(this));
    self.pool.on('peerdisconnect', self.peerDisconnected.bind(this));
    self.pool.on('peerheaders', self.peerHeaders.bind(this));
    
    // TODO:
    self.pool.on('peerinv', self.peerInv.bind(this));
    self.pool.on('peertx', self.peerTx.bind(this));
    self.pool.on('peerping', self.peerPing.bind(this));
    self.pool.on('peererror', self.peerError.bind(this));
    
    self.pool.connect();
    this.connected = true;


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
    console.log('removing:', addr.hash);
    for(var i in self.peers) {
        if(peer.host == self.peers[i].host){
            if(peer == self.downloadPeer){
                // TODO: is this good enough, or do we need to re-set it here?
                self.downloadPeer = null;
            }
            self.peers.splice(i-1,1);
            break;
        }
    }
}

PeerManager.prototype.peerInv = function(peer, message) {
    var self = this;
    var txHashes = [], blockHashes = [];
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
            self.getLatestBlockHash() == blockHashes[0].toString('hex')) {
        console.log('already had latest block, ignoring');
        blockHashes = [];
    }
    if(blockHashes.length == 1) {
        console.log('got new block!', blockHashes[0]);
        peer.sendMessage(
            new Messages.GetHeaders([self.getLatestBlockHash()]));
    }
}

PeerManager.prototype.peerTx = function(peer, message) {
    console.log('peertx', message);
}

PeerManager.prototype.peerPing = function(peer, message) {
    //console.log('peerping', message);
    // TODO: pong?
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
        if(blockHeader.validProofOfWork()) {
            var prevHash = bufferUtil.reverse(blockHeader.prevHash).toString('hex');
            if(!self.knownBlockHashes.length && blockHeader.hash) {
                // First block
                self.knownBlockHashes.push(blockHeader.hash);
            } else if (prevHash == self.getLatestBlockHash()) {
                self.knownBlockHashes.push(blockHeader.hash);
            } else {
                console.log('block didnt go on chain');
            }
            var syncedHeight = self.syncedHeight();
            if(syncedHeight > self.bestHeight) {
                self.bestHeight = syncedHeight;
            }
        }
    }

    // If we still have more messages to get
    if(self.syncedHeight() < self.estimatedBlockHeight()) {
        console.log('getting more headers');
        var lastHeader = message.headers[message.headers.length - 1];
        peer.sendMessage(new Messages.GetHeaders([lastHeader.id]));
    }
}

PeerManager.prototype.disconnect = function() {
    this.pool.disconnect();
}

PeerManager.prototype.syncProgress = function() {
    var self = this;
    //TODO: this is really crude and crappy atm
    return self.knownBlockHashes.length /
        (self.estimatedBlockHeight() - STARTING_BLOCK_HEIGHT)
}

PeerManager.prototype.estimatedBlockHeight = function() {
    var self = this;
    if(!self.downloadPeer) {
        return 0;
    }
    return Math.max(self.downloadPeer.bestHeight, self.syncedHeight());
}

PeerManager.prototype.syncedHeight = function() {
    var self = this;
    return STARTING_BLOCK_HEIGHT + self.knownBlockHashes.length;
}

PeerManager.prototype.bestHeight = function() {
    var self = this;
    return Math.max(self.syncedHeight(), self._bestHeight)
}

PeerManager.prototype.getLatestBlockHash = function() {
    var self = this;
    return self.knownBlockHashes[self.knownBlockHashes.length -1]
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
    console.log('setting download peer');
    self.downloadPeer = peer;
    // TODO: For now we always just start with startingBlock, fix that
    peer.sendMessage( new Messages.GetHeaders([STARTING_BLOCK_HASH]) );
}


module.exports = PeerManager;
