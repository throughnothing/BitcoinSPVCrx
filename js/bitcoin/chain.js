'use script';
var EventEmitter = require('events').EventEmitter,
    bitcore = require('bitcore'),
    bufferUtil = bitcore.util.buffer,
    util = require('util'),
    constants = require('./constants');

function Chain(options) {
  if (!(this instanceof Chain))
    return new Chain(options);

  this.options = options || {};
  this.network = this.options.network || bitcore.Networks.defaultNetwork;
  this.blocks = [];

  return this;
}

Chain.prototype.add = function(blockHeader) {
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

// TODO: Move to Chain()
Chain.prototype.getStartingBlock = function() {
  // TODO: base this on wallet start time (?)
  if(this.network && this.network.alias == 'mainnet') {
    return constants.CHECKPOINTS[constants.CHECKPOINTS.length - 2];
  } else {
    return constants.TESTNET_CHECKPOINTS[constants.TESTNET_CHECKPOINTS.length - 1];
  }
}


Chain.prototype.estimatedBlockHeight = function() {
  // Estimate 10 minutes per block
  var latestBlock = this.getLatestBlock() || this.getStartingBlock();
  var latestBlockTime = latestBlock ?
    latestBlock.time : this.getStartingBlock()[2];
  var latestBlockHeight = this.getSyncedHeight();

  return latestBlockHeight +
    Math.floor((+new Date() / 1000 - latestBlockTime)/(10*60));
}

Chain.prototype.getLatestBlock = function() {
  return this.blocks[this.blocks.length-1]
}

Chain.prototype.syncProgress = function() {
  // from bcoin
  var startCheckpointTime = this.getStartingBlock()[2]
  var total = (+new Date() / 1000 - 40 * 60) - startCheckpointTime;
  var current = this.blocks[this.blocks.length - 1].time - startCheckpointTime;
  return Math.max(0, Math.min(current / total, 1));
}


//TODO: do we need this method?
Chain.prototype.getSyncedHeight = function() {
  return this.getStartingBlock()[0] + this.blocks.length;
}

Chain.prototype.timestampForBlockHeight = function(blockHeight) {
  // TODO:
  //if (blockHeight > this.syncedBlockHeight()) {
  //// future block, assume 10 minutes per block after last block
  //return this.lastBlock.timestamp + (blockHeight - this.lastBlockHeight)*10*60;
  //}
}


module.exports = Chain;
