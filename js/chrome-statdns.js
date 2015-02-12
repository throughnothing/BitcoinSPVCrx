'use strict';
/* This is a 'dns' module 'replacement' since Chrome App API
 * has no dns abilities :(  I didn't want to make a full blown
 * dns client, so this is a temporary workaround using statdns.com's
 * HTTP interface to DNS, as this was simple to get up and running
 * with quickly.
 *
 * Currently this is just barebones what is needed by bitcoin-p2p/pool.js
 * May break this out into its own module eventually.
 *
 */

var base_url='http://api.statdns.com/';

// This is for running with node for testing
//if(!window) {
    //require.ensure([], function(require){
        //XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    //});
//}

exports.resolve = function(domain, rrtype, cb) {
    var res;
    if (!cb) {
        cb = rrtype;
        rrtype = undefined;
    }
    if(!rrtype) {
        rrtype = 'A'
    }

    var xhr = new XMLHttpRequest();
    xhr.open("GET", base_url + domain + '/' + rrtype, true);
    xhr.onload = function(e) {
        var ips = [];
        var response = JSON.parse(this.responseText);
        if(response.code) {
            return cb("Bad DNS lookup response")
        };
        for (var i in response.answer) {
            ips.push(response.answer[i].rdata);
        }
        cb(null, ips);
    }
    xhr.onerror = function(e) { cb("Error with dns lookup request") }
    xhr.send();
};
