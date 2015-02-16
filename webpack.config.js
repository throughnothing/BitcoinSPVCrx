'use strict';
var webpack = require('webpack');

module.exports = {
  cache: true,
  entry: {
    background: './js/background',
    app: './js/app'
  },
  output: {
    path: __dirname + '/build/js',
    filename: '[name].js'
  },
  resolve: {
    extensions: ['', '.js', '.jsx', '.json','.css'],
    alias: {
      net: 'chrome-net',
      dns: __dirname + '/js/chrome-statdns',
      dgram: 'chrome-dgram',
      lodash: __dirname + '/js/lodash'
    }
  },
  module: {
    loaders: [
      //{ test: /\.jsx?$/, loader: 'jsx-loader?harmony' },
      { test: /\.json$/, loader: 'json-loader' },
      // Bootstrap-webpack stuff

      // **IMPORTANT** This is needed so that each bootstrap js file required by
      // bootstrap-webpack has access to the jQuery object
      { test: /bootstrap\/js\//, loader: 'imports?jQuery=jquery' },

      // Needed for the css-loader when [bootstrap-webpack](https://github.com/bline/bootstrap-webpack)
      // loads bootstrap's css.
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
    // Don't put xmlhttprequest into the browser!
    //new webpack.IgnorePlugin(new RegExp("^xmlhttprequest$"))
  ]
};
