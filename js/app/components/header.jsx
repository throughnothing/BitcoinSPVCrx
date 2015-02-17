'use strict';

var React = require('react'),
    Router = require('react-router'),
    RouteHandler = Router.RouteHandler;


module.exports = React.createClass({
  render: function() {
    return (
      <nav className="navbar navbar-default navbar-fixed-top" role="navigation">
        <div className="navbar-header text-center">
          <a className="navbar-brand" href="#">BitcoinSPVCrx</a>
        </div>
        <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
          <span className="sr-only">Toggle navigation</span>
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
        </button>
        <div id="navbar" className="navbar-collapse collapse text-center">
          <ul className="nav navbar-nav">
            {/*<li className="active"><a href="#">Home</a></li>*/}
            <li><a href="#settings">Settings</a></li>
            <li><a href="#about">About</a></li>
          </ul>
        </div>
      </nav>
    );
  }
});
