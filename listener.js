import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { Picker } from 'meteor/meteorhacks:picker';
import { _ } from 'meteor/underscore';
import { EJSON } from 'meteor/ejson';

const ipn = Npm.require('paypal-ipn');
const bodyParser = Npm.require('body-parser');

const configurePicker = function() {
  const routes = Picker.filter(function(req, res) {
    return req.method === "POST";
  });

  routes.middleware( bodyParser.urlencoded( { extended: false } ) );
  routes.middleware( bodyParser.json() );

  return routes;
};

export const IpnListener = function(config) {
  const self = this;
  this._path = config.path;
  this._host = config.host || Meteor.absoluteUrl();
  this._url = this._host.concat(this._path.slice(1));
  this._onVerified = [];
  this._onError = [];
  this._allow_sandbox = config.allow_sandbox || false;
  this._picker.route(config.path, self.handler());
  this._verify = Meteor.wrapAsync(ipn.verify, ipn);
};

IpnListener.prototype._picker = configurePicker();

IpnListener.prototype.onVerified = function(handler) {
  this._onVerified.push(handler);
};

IpnListener.prototype.onError = function(handler) {
  this._onError.push(handler);
};

IpnListener.prototype.verify = function(data) {
  return this._verify(data, { allow_sandbox: this._allow_sandbox});
};

IpnListener.prototype.handleIpns = function(data) {
  _.each(this._onVerified, function(handler) {
    let req = EJSON.parse(EJSON.stringify(data));
    return handler(null, req);
  });
};

IpnListener.prototype.url = function() {
  return this._url;
};

IpnListener.prototype.post = function(httpOptions, options) {
  let self = this;
  if (options && options.verify) {
    return post();
  }

  var oldVerify = self._verify;
  self._verify = function() { return 'VERIFIED'; };
  let result =  post();
  self._verify = oldVerify;

  return result;

  function post() {
    let url = self.url();
    return HTTP.post(url, httpOptions);
  }
};

IpnListener.prototype.handleErrors = function(error, data) {
  _.each(this._onError, function(handler) {
    let req = EJSON.parse(EJSON.stringify(data));
    return handler(error, data);
  });
};

IpnListener.prototype.handler = function() {
  const self = this;
  return function(params, req, res, next) {
    res.writeHead(200);

    try {
      let verified = self.verify(req.body, { allow_sandbox: self._allow_sandbox });

      if ( verified !== true && verified !== 'VERIFIED' ) {
        throw new Error('unverified');
      }

      self.handleIpns(req.body);

    } catch (e) {
      self.handleErrors(e, req.body);
    }

    res.end();
  };
};
