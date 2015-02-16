'use strict';

var React = require('react');

module.exports = React.createClass({
  render: function() {
    return (
      <div id="footer">
        <div className="col-xs-12 navbar-inverse navbar-fixed-bottom">
          <div className="row" id="bottomNav">
            <div className="col-xs-6 text-center"><a href="#send"><i className="glyphicon glyphicon-circle-arrow-up"></i><br/>Send</a></div>
            <div className="col-xs-6 text-center"><a href="#receive"><i className="glyphicon glyphicon-circle-arrow-down"></i><br/>Receive</a></div>
          </div>
        </div>
      </div>
    );
  }
});
