'use strict';

require ('bootstrap-webpack!../bootstrap.config.js');
var $ = require('jquery'),
    QRCode = require('./qrcode'),
    React = require('react'),
    router = require('./router'),
    messaging = require('./messaging');


router.run((Handler, state) => {
  React.render(<Handler {...state} />, document.body);
});
