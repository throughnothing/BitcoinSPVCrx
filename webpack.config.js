'use strict';
var webpack = require('webpack');

module.exports = {
  cache: true,
  entry: {
    background: './js/chrome/background',
    app: './js/app/index'
  },
  output: {
    path: __dirname + '/build',
    filename: '[name].js'
  },
  resolve: {
    extensions: ['', '.js', '.jsx', '.json'],
    alias: {
      net: 'chrome-net',
      dns: __dirname + '/js/chrome/chrome-statdns',
      dgram: 'chrome-dgram',
      lodash: __dirname + '/js/vendor/lodash'
    }
  },
  module: {
    loaders: [
      { test: /\.jsx?$/, loader: 'jsx-loader?harmony', exclude: [/node_modules/, /config\.js/] },
      { test: /\.json$/, loader: 'json-loader' },
      // Bootstrap-webpack stuff

      // **IMPORTANT** This is needed so that each bootstrap js file required by
      // bootstrap-webpack has access to the jQuery object
      { test: /bootstrap\/js\//, loader: 'imports?jQuery=jquery' },

      // Needed for the css-loader when [bootstrap-webpack](https://github.com/bline/bootstrap-webpack)
      { test: /\.woff2$/,                      loader: "url?limit=10000&minetype=application/x-font-woff" },
      { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,   loader: "url?limit=10000&minetype=application/x-font-woff" },
      { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,    loader: "url?limit=10000&minetype=application/octet-stream" },
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,    loader: "file" },
      { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,    loader: "url?limit=10000&minetype=image/svg+xml" }
    ]

  },
  plugins:[
    // make sure that the files in the generated bundle are included in the
    // same order between builds
    new webpack.optimize.OccurenceOrderPlugin(),
    //new webpack.optimize.UglifyJsPlugin()
  ]
};
