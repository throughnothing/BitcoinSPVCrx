'use script';
var EventEmitter = require('events').EventEmitter,
    bitcore = require('bitcore'),
    BlockHeader = bitcore.BlockHeader,
    bufferUtil = bitcore.util.buffer,
    util = require('util'),
    constants = require('./constants');

function Chain(options) {
  if (!(this instanceof Chain))
    return new Chain(options);
  this.options = options || {};
  this.network = this.options.network || bitcore.Networks.defaultNetwork;
  this.blocks = [];

  this._load();
}

Chain.prototype._load() = function() {
  // TODO: Load the MAINNET_CHECKPOINTS
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
    } else if (prevHash == this.getLastBlock().hash) {
      this.blocks.push(blockHeader);
    } else {
      // TODO: do something better here?
      //console.log('block didnt go on chain');
    }
  }
}

Chain.prototype.getStartingBlock = function() {
  // TODO: base this on wallet start time (?)
  return new BlockHeader.fromJSON(this.getStartingBlockJSON());
}

Chain.prototype.getStartingBlockJSON = function() {
  return constants.MAINNET_CHECKPOINTS[constants.MAINNET_CHECKPOINTS.length - 2];
}

Chain.prototype.estimatedBlockHeight = function() {
  // Estimate 10 minutes per block
  var latestBlock = this.getLastBlock() || this.getStartingBlock();
  var latestBlockHeight = this.getSyncedHeight();

  return latestBlockHeight +
    Math.floor((+new Date() / 1000 - latestBlock.time)/(10*60));
}

Chain.prototype.getLastBlock = function() {
  return this.blocks[this.blocks.length-1]
}

Chain.prototype.syncProgress = function() {
  // from bcoin
  var startCheckpointTime = this.getStartingBlock().time;
  var total = (+new Date() / 1000 - 40 * 60) - startCheckpointTime;
  var current = this.blocks[this.blocks.length - 1].time - startCheckpointTime;
  return Math.max(0, Math.min(current / total, 1));
}


//TODO: do we need this method?
Chain.prototype.getSyncedHeight = function() {
  return this.getStartingBlockJSON().height + this.blocks.length;
}

Chain.prototype.timestampForBlockHeight = function(blockHeight) {
  // TODO:
  //if (blockHeight > this.syncedBlockHeight()) {
  //// future block, assume 10 minutes per block after last block
  //return this.lastBlock.timestamp + (blockHeight - this.lastBlockHeight)*10*60;
  //}
}


module.exports = Chain;
