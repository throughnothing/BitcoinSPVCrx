# BitcoinSPVCrx

BitcoinSPVCrx aims to be a Bitcoin SPV Client/Node + Wallet that can run
entirely in Chrome and on a Chromebook.  It will also eventually work
with hardwear wallets like Trezor using chrome's usb HID interface.

Currently it can connect to the bitcoin network, and validate the
blockchain headers.

BitcoinSPVCrx is a terrible, terrible, name.  I plan to rename it when I
come up with something better.  Suggestions welcome!

## Running in Chrome

To run the app, you *do not* need to install the developer requirements
listed below if you don't want to modify the code.

Simply enable "Developer mode" checkbox in the upper-right-hand corner of
`chrome://extensions` and then click "Load unpacked extension..." and pick
the `build/` directory of this repo.

The `build/manifest.json`, along with the `build/js/background.js` file that
it points to will tell chrome how to run everything.

If you want to modify the code and run your modifications, you will need to
proceed with the development requirements below.

## Development requirements

  * Chrome 38 or later. If you're on dev channel you should be fine.
  * Node + [npm](https://www.npmjs.org/).
  * Webpack + App dependencies:
    * `sudo npm -g install webpack && npm install`

## Build

To build run: `npm run build`

Whenever you make changes to the javascript in the `js/` directory, you will
need to run this again before re-launching the app from Chrome.

## Notes

BitcoinSPVCrx is currently using [bitcore](http://bitcore.io/) to talk to
the bitcoin network, and for bitcoin crypto/verification functions.

It's also using [chrome-net](https://github.com/feross/chrome-net) to
replace use of node's `net` module when run in the browser.  This replaces
`net` with an implementation of it's interface that uses Chrome's sockets
API underneath.

For now, I have a
[slightly modified version](https://github.com/throughnothing/bitcore-p2p) of
[bitcore-p2p](https://github.com/bitpay/bitcore-p2p) which makes it work around
some [edge](https://github.com/feross/chrome-net/pull/22)
[cases](https://github.com/feross/chrome-net/pull/23) i've discovered with
`chrome-net`.

BitcoinSPVCrx also uses `js/chrome-statdns.js` to replace node's `dns` module
when run in Chrome.  This uses [statdns](http://www.statdns.com/) HTTP API to
resolve DNS entries for bitcoin node seed-finding.  I hope to improve on this
in the future, and not rely on a single service for this, but it works for now.
