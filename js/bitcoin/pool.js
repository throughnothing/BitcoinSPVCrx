'use strict';
var P2P = require('bitcore-p2p'),
    Messages = P2P.Messages,
    bitcore = require('bitcore'),
    BlockHeader = bitcore.BlockHeader,
    bufferUtil = bitcore.util.buffer,
    EventEmitter = require('events').EventEmitter,
    util = require('util');

var Chain = require('./chain'),
    constants = require('./constants');


function Pool(options) {
  if (!(this instanceof Pool))
    return new Pool(options);

  this.options = options || {};
  this.options.peerTimeout = this.options.peerTimeout || 3000;
  this.options.relay = this.options.relay !== false;
  this.size = this.options.size || 3;
  this.network = bitcore.Networks[this.options.network]
    || bitcore.Networks.defaultNetwork;
  this.connected = false;

  this.peers = {
    loader: null,
    pending: [],
    connected: []
  };
  // TODO: move the use of this to Chain() calls
  this.blocks = [];

  this.chain = null;
  this.pool = null;
}
util.inherits(Pool, EventEmitter);

Pool.prototype.connect = function() {
  if(this.connected) return;

  // TODO: pass in options to the pool?
  this.pool = new P2P.Pool();
  // TODO: pass in options (storage, etc.) to the Chain?
  this.chain = new Chain();
  this.pool.on('peerconnect', this._handlePeerConnect.bind(this));
  this.pool.on('peerready', this._handlePeerReady.bind(this));
  this.pool.on('peerdisconnect', this._handlePeerDisconnect.bind(this));
  this.pool.on('peerheaders', this._handlePeerHeaders.bind(this));
  this.pool.on('peerinv', this._handlePeerInv.bind(this));
  this.pool.on('peererror', this._handlePeerError.bind(this));

  this.pool.connect();
  this.connected = true;

  // TODO: figure out why this is needed
  var poolTimeout = setTimeout(function(){
    this.disconnect().connect();
  }.bind(this),3000);
  this.pool.once('peerready', function() { clearTimeout(poolTimeout); });

  return this;
}

Pool.prototype._handlePeerConnect = function(peer) {
  this.peers.pending.push(peer);

  // Only wait 2 seconds for verAck
  var peerTimeout = setTimeout(function() {
    peer.disconnect();
  },2000);
  // Clear timeout once peer is ready
  peer.on('ready', function() { clearTimeout(peerTimeout); });
  this.emit('peer-connect', peer)
}

Pool.prototype._handlePeerReady = function(peer, addr) {
  this._removePeer(peer);
  this.peers.connected.push(peer);
  this.emit('peer-ready', peer);

  //TODO: Smarter loader peer choosing
  if(!this.peers.loader) {
    this._setLoaderPeer(peer);
  }
}

Pool.prototype._handlePeerDisconnect = function(peer, addr) {
  this._removePeer(peer);
  this.emit('peer-disconnect', peer)
}

Pool.prototype._handlePeerInv = function(peer, message) {
  var txHashes = [], blockHashes = [];

  if(message.count > constants.MAX_GETDATA_HASHES) {
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
}

Pool.prototype._handlePeerError = function(peer, e) {
  this.emit('peer-error');
  peer.disconnect();
}

Pool.prototype._handlePeerHeaders = function(peer, message) {
  for(var i in message.headers) {
    var blockHeader = new BlockHeader(message.headers[i]);
    // TODO: This won't handle chain forks, it'll just accept the first
    // valid proof on top of the current chain.  It won't be able to find
    // another chain that grows longer than the first one seen.
    if(blockHeader.validProofOfWork()) {
      var prevHash = bufferUtil.reverse(blockHeader.prevHash).toString('hex');
      if(!this.blocks.length && blockHeader.hash) {
        // First block
        this.blocks.push(blockHeader);
      } else if (prevHash == this.getLatestBlock().hash) {
        this.blocks.push(blockHeader);
      } else {
        // TODO: do something better here?
        //console.log('block didnt go on chain');
      }
    }
  }

  // TODO: this can probably go some place better/more accurate
  this.emit('chain-progress', this.syncProgress());

  // If we got 2000 messages, assume we still have more to get
  if(message.headers.length == 2000) {
    var lastHeader = message.headers[message.headers.length - 1];
    peer.sendMessage(new Messages.GetHeaders([lastHeader.id]));
  } else {
    // TODO: can probably emit this more accurately as well
    this.emit('chain-full');
  }
}

Pool.prototype.disconnect = function() {
  this.connected=false;
  this.pool.disconnect();
  return this;
}

//TODO: Move this method to Chain.*
Pool.prototype.syncProgress = function() {
  // from bcoin
  var startCheckpointTime = this._getStartingCheckpoint()[2]
  var total = (+new Date() / 1000 - 40 * 60) - startCheckpointTime;
  var current = this.blocks[this.blocks.length - 1].time - startCheckpointTime;
  return Math.max(0, Math.min(current / total, 1));
}

// TODO: Move to Chain()
Pool.prototype.estimatedBlockHeight = function() {
  // Estimate 10 minutes per block
  var latestBlock = this.getLatestBlock() || this._getStartingCheckpoint();
  var latestBlockTime = latestBlock ?
    latestBlock.time : this._getStartingCheckpoint()[2];
  var latestBlockHeight = this.syncedHeight();

  return latestBlockHeight +
    Math.floor((+new Date() / 1000 - latestBlockTime)/(10*60));
}

//TODO: Move to Chain()
Pool.prototype.syncedHeight = function() {
  return this._getStartingCheckpoint()[0] + this.blocks.length;
}

//TODO: Move to Chain()
Pool.prototype.getLatestBlock = function() {
  return this.blocks[this.blocks.length-1]
}

// TODO: Move this to Chain()
Pool.prototype.timestampForBlockHeight = function(blockHeight) {
  // TODO:
  //if (blockHeight > this.syncedBlockHeight()) {
  //// future block, assume 10 minutes per block after last block
  //return this.lastBlock.timestamp + (blockHeight - this.lastBlockHeight)*10*60;
  //}
}

Pool.prototype._setLoaderPeer = function(peer) {
  this.peers.loader = peer;
  // TODO: For now we always just start with startingBlock, fix that
  peer.sendMessage(new Messages.GetHeaders([this._getStartingCheckpoint()[1]]));
}

// TODO: Move to Chain()
Pool.prototype._getStartingCheckpoint = function() {
  // TODO: base this on wallet start time (?)
  if(this.network && this.network.alias == 'mainnet') {
    return constants.CHECKPOINTS[constants.CHECKPOINTS.length - 2];
  } else {
    return constants.TESTNET_CHECKPOINTS[constants.TESTNET_CHECKPOINTS.length - 1];
  }
}

Pool.prototype._removePeer = function(peer) {
  var i = this.peers.pending.indexOf(peer);
  if (i !== -1) {
    this.peers.pending.splice(i, 1);
  }

  i = this.peers.connected.indexOf(peer);
  if (i !== -1) {
    this.peers.connected.splice(i, 1);
  }

  if (this.peers.loader === peer) {
    this.peers.load = null;
  }
}

Pool.Events = [
  'chain-progress','chain-full', 'peer-error',
  'peer-connect','peer-disconnect', 'peer-ready'
];

module.exports = Pool;
