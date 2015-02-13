'use strict';
var bitcorep2p = require('bitcore-p2p'),
    Pool = bitcorep2p.Pool,
    Messages = bitcorep2p.Messages,
    bitcore = require('bitcore'),
    BlockHeader = bitcore.BlockHeader;


// from: https://github.com/voisine/breadwallet/blob/master/BreadWallet/BRPeerManager.m
var genesisBlockHash = new Buffer("000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f", 'hex');
//{"version":1,"prevHash":"6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000","merkleRoot":"982051fd1e4ba744bbbe680e1fee14677ba1a3c3540bf7b1cdb606e857233e0e","time":1231469665,"bits":486604799,"nonce":2573394689}
var genesisBlockHeader = {
    version: 1,
    prevHash: new Buffer('0000000000000000000000000000000000000000000000000000000000000000','hex'),
    merkleRoot: new Buffer('4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b','hex'),
    time:'1231006505',
    bits: '486604799',
    nonce: 2083236893,
};
//console.log('genesis:',genesisBlockHeader);

var lastBlock = 0;
var bestHeightSeen = 0;

// Store the chain here for now!
var blockChain = []

Pool.MaxConnectedPeers = 1;
var pool = new Pool();

module.exports.run = function() {

    //pool.on('seed', function(ips) { console.log('seed! '); });
    //pool.on('seederror', function(err) { console.log('seederror ', err); });
    //pool.on('peerinv', function(peer, message) { console.log('perinv!', message); });
    pool.on('peerheaders', function(peer, message) {
        //console.log('peerheaders!', message.headers);
        for(var i in message.headers) {
            var blockHeader = BlockHeader(message.headers[i]);
            //blockHeader.version=1;
            //if(blockHeader.version == 1 ) {
            console.log('header: ', blockHeader.toJSON(), blockHeader.hash);
            //}
            if(i > 20) { break; }
        }
    });
    pool.on('peerready', function(peer, addr) {
        console.log('connected: ', addr.ip.v4);
        if (peer.bestHeight > bestHeightSeen) {
            bestHeightSeen = peer.bestHeight;
        }
        var latestHeader = genesisBlockHash;
        if(blockChain[-1]){
            console.log(blockChain[-1]);
            latestHeader = blockChain[-1].merkleRoot.toString('hex');
        }
        var getHeadersMsg = new Messages.GetHeaders([genesisBlockHash]);
        peer.sendMessage(getHeadersMsg);
    });
    pool.on('peeraddrdisconnect', function(peer, addr) {
        console.log('removing', addr.hash);
    });
    //pool.on('peertx', function(peer, message) { console.log('peertx: ', peer, ', Message: ', message); });
    //pool.on('peerping', function(peer, message) { console.log('peeraddr: ', peer, ', Message: ', message); });
    pool.connect();

}

module.exports.stop = function() {
    pool.disconnect();
}

setTimeout(function(){
    console.log('bestHeightSeen:', bestHeightSeen);
},2000);
