# BitcoinSPVCrx

BitcoinSPVCrx aims to be a Bitcoin SPV Client/Node + Wallet that can run
entirely in Chrome and on a Chromebook.  It will also eventually work
with hardwear wallets like Trezor using chrome's usb HID interface and
my [chrome-trezor](https://github.com/throughnothing/chrome-trezor) module.

The SPV client + wallet code for this project has been broken out into the
[bitcore-spv](https://github.com/throughnothing/bitcore-spv) module, to make
improvement of each piece easier.

BitcoinSPVCrx is a terrible, terrible, name.  I plan to rename it when I
come up with something better.  Suggestions welcome!

## Running in Chrome

To run the app, you *do not* need to install the developer requirements
listed below if you don't want to modify the code.  To run the app without
building, you should check out the `master-built` directory, which has the 
`build` directory files built and updated from master periodically.

Simply check out `master-built`, enable "Developer mode" checkbox in the
upper-right-hand corner of `chrome://extensions` and then click
"Load unpacked extension..." and pick the `build/` directory of this repo.

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

Whenever you make changes to the javascript in the `*js/` directories, you will
need to run this again before re-launching the app from Chrome.

## Notes

BitcoinSPVCrx is currently using
[chrome-net](https://github.com/feross/chrome-net) to replace use of node's
`net` module when run in the browser.  This replaces `net` with an
implementation of it's interface that uses Chrome's sockets API underneath.

BitcoinSPVCrx also uses `js/chrome/chrome-statdns.js` to replace node's
`dns` module when run in Chrome.  This uses [statdns](http://www.statdns.com/)
HTTP API to resolve DNS entries for bitcoin node seed-finding.  I hope to
improve on this in the future, and not rely on a single service for this,
but it works for now.
