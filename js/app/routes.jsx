'use strict';
var React = require('react'),
    Router = require('react-router'),
    Route = Router.Route,
    App = require('./App');

module.exports = (
  <Route name="app" path="/" handler={App}>
    {/*<Route name="transactions" handler ={Transactions}/>*/}
    {/*<Route name="settings" handler ={Settings}/>*/}
    {/*<Route name="about" handler ={About}/>*/}
    {/*<DefaultRoute handler ={Receive}/>*/}
  </Route>
);

