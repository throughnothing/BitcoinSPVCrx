'use strict';
var webpack = require('webpack');

module.exports = {
    entry: {
      background: './js/background',
      app: './js/app'
    },
    output: {
        path: __dirname + '/build/js',
        filename: '[name].js'
    },
    resolve: {
        extensions: ['', '.js', '.jsx', '.json'],
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
            { test: /\.json$/, loader: 'json-loader' }
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
