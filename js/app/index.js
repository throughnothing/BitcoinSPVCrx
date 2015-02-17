'use strict';

require ('bootstrap-webpack!../../bootstrap.config.js');
var $ = require('jquery'),
    React = require('react'),
    QRCode = require('../vendor/qrcode'),
    router = require('./router'),
    messaging = require('../chrome/messaging');


router.run((Handler, state) => {
  React.render(<Handler {...state} />, document.body);
});
