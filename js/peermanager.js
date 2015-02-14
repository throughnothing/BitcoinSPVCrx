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
    //this.lastBlockHeight = 0;
    // last block height reported by current download peer
    this.peerCount = 0;
    this.pool = null;
    this.peers = [];
    this.downloadPeer = null;
    // TODO: Store the chain here for now!
    this.blockChain = [];
}

PeerManager.prototype.connect = function() {
    var self = this;

    self.pool = new Pool();
    self.pool.on('peerready', self.peerConnected.bind(this));
    self.pool.on('peeraddrdisconnect', self.peerDisconnected.bind(this));
    self.pool.on('peerheaders', self.peerHeaders.bind(this));
    
    // TODO:
    self.pool.on('peerinv', self.peerInv.bind(this));
    self.pool.on('peertx', self.peerTx.bind(this));
    self.pool.on('peerping', self.peerPing.bind(this));
    
    self.pool.connect();
    this.connected = true;


}

PeerManager.prototype.peerConnected = function(peer, addr) {
    var self = this;
    console.log('connected: ', addr.ip.v4);
    //TODO: Smarter peerDownload detection
    if(!self.downloadPeer) {
        self._setDownloadPeer(peer);
    }
    self.peers.push(peer);
}

PeerManager.prototype.peerDisconnected = function(peer, addr) {
    console.log('removing', addr.hash);
    for(var i in self.peers) {
        if(peer.host == self.peers[i].host){
            self.peers.splice(i-1,1);
            break;
        }
    }
}

PeerManager.prototype.peerInv = function(peer, message) {
    console.log('peerinv', message);
}

PeerManager.prototype.peerTx = function(peer, message) {
    console.log('peertx', message);
}

PeerManager.prototype.peerPing = function(peer, message) {
    console.log('peerping', message);
}

PeerManager.prototype.peerHeaders = function(peer, message) {
    var self = this;
    console.log('headers response');
    for(var i in message.headers) {
        var blockHeader = new BlockHeader(message.headers[i]);
        if(blockHeader.validProofOfWork()) {
            var prevHash = bufferUtil.reverse(blockHeader.prevHash).toString('hex');
            var latestBlock = self.blockChain[self.blockChain.length-1];
            if(!self.blockChain.length && blockHeader.hash) {
                console.log('got first block');
                self.blockChain.push(blockHeader);
            } else if (latestBlock && prevHash == latestBlock.hash) {
                self.blockChain.push(blockHeader);
            } else {
                console.log('block didnt go on chain');
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
    console.log('estimatedBlockHeight',self.estimatedBlockHeight(), self.syncedHeight());
    //TODO: this is really crude and crappy atm
    return self.blockChain.length /
        (self.estimatedBlockHeight() - STARTING_BLOCK_HEIGHT)
}

PeerManager.prototype.estimatedBlockHeight = function() {
    var self = this;
    if(!self.downloadPeer) {
        return 0;
    }
    return self.downloadPeer.bestHeight;
}

PeerManager.prototype.syncedHeight = function() {
    var self = this;
    return STARTING_BLOCK_HEIGHT + self.blockChain.length;
}

PeerManager.prototype._setDownloadPeer = function(peer) {
    var self = this;
    console.log('setting download peer');
    self.downloadPeer = peer;
    // TODO: For now we always just start with startingBlock, fix that
    peer.sendMessage( new Messages.GetHeaders([STARTING_BLOCK_HASH]) );
}


module.exports = PeerManager;
