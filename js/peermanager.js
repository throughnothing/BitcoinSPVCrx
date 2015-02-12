'use strict';
var bitcorep2p = require('bitcore-p2p'),
    Pool = bitcorep2p.Pool,
    Messages = bitcorep2p.Messages,
    bitcore = require('bitcore'),
    BlockHeader = bitcore.BlockHeader;


// from: https://github.com/voisine/breadwallet/blob/master/BreadWallet/BRPeerManager.m
var checkpoints = [
    [      0, "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f", 1231006505, '0x1d00ffffu' ],
    [  20160, "000000000f1aef56190aee63d33a373e6487132d522ff4cd98ccfc96566d461e", 1248481816, '0x1d00ffffu' ],
    [  40320, "0000000045861e169b5a961b7034f8de9e98022e7a39100dde3ae3ea240d7245", 1266191579, '0x1c654657u' ],
    [  60480, "000000000632e22ce73ed38f46d5b408ff1cff2cc9e10daaf437dfd655153837", 1276298786, '0x1c0eba64u' ],
    [  80640, "0000000000307c80b87edf9f6a0697e2f01db67e518c8a4d6065d1d859a3a659", 1284861847, '0x1b4766edu' ],
    [ 100800, "000000000000e383d43cc471c64a9a4a46794026989ef4ff9611d5acb704e47a", 1294031411, '0x1b0404cbu' ],
    [ 120960, "0000000000002c920cf7e4406b969ae9c807b5c4f271f490ca3de1b0770836fc", 1304131980, '0x1b0098fau' ],
    [ 141120, "00000000000002d214e1af085eda0a780a8446698ab5c0128b6392e189886114", 1313451894, '0x1a094a86u' ],
    [ 161280, "00000000000005911fe26209de7ff510a8306475b75ceffd434b68dc31943b99", 1326047176, '0x1a0d69d7u' ],
    [ 181440, "00000000000000e527fc19df0992d58c12b98ef5a17544696bbba67812ef0e64", 1337883029, '0x1a0a8b5fu' ],
    [ 201600, "00000000000003a5e28bef30ad31f1f9be706e91ae9dda54179a95c9f9cd9ad0", 1349226660, '0x1a057e08u' ],
    [ 221760, "00000000000000fc85dd77ea5ed6020f9e333589392560b40908d3264bd1f401", 1361148470, '0x1a04985cu' ],
    [ 241920, "00000000000000b79f259ad14635739aaf0cc48875874b6aeecc7308267b50fa", 1371418654, '0x1a00de15u' ],
    [ 262080, "000000000000000aa77be1c33deac6b8d3b7b0757d02ce72fffddc768235d0e2", 1381070552, '0x1916b0cau' ],
    [ 282240, "0000000000000000ef9ee7529607286669763763e0c46acfdefd8a2306de5ca8", 1390570126, '0x1901f52cu' ],
    [ 302400, "0000000000000000472132c4daaf358acaf461ff1c3e96577a74e5ebf91bb170", 1400928750, '0x18692842u' ],
    [ 322560, "000000000000000002df2dd9d4fe0578392e519610e341dd09025469f101cfa1", 1411680080, '0x181FB893u' ],
    [ 342720, "00000000000000000f9cfece8494800d3dcbf9583232825da640c8703bcd27e7", 1423496415, '0x1818BB87u' ]
];
var genesisBlockHeader = new Buffer(checkpoints[0][1], 'hex');
var lastBlock = 0;
var bestHeightSeen = 0;

Pool.MaxConnectedPeers = 3;
var pool = new Pool();

module.exports.run = function() {

    //pool.on('seed', function(ips) { console.log('seed! '); });
    //pool.on('seederror', function(err) { console.log('seederror ', err); });
    pool.on('peerinv', function(peer, message) {
        console.log('perinv!', message);
    });
    pool.on('peerheaders', function(peer, message) {
        console.log('peerheaders!', message.headers);
        for(var i in message.headers) {
            console.log(message.headers[i]);
            var blockHeader = BlockHeader(message.headers[i]);
            var valid = blockHeader.validProofOfWork();
            if(blockHeader.validProofOfWork()) {
                console.log('valid');
            } else {
                console.log('not valid :(');
            }
        }
    });
    pool.on('peerready', function(peer, addr) {
        console.log('adding', addr.hash);
        if (peer.bestHeight > bestHeightSeen) {
            bestHeightSeen = peer.bestHeight;
        }
        //var getHeadersMsg = new Messages.GetHeaders([genesisBlockHeader]);
        //peer.sendMessage(getHeadersMsg);
        var getBlocksMsg = new Messages.GetBlocks([genesisBlockHeader]);
        peer.sendMessage(getBlocksMsg);
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
