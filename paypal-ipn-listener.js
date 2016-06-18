import { Meteor } from 'meteor/meteor';
import { Picker } from 'meteor/meteorhacks:picker';
import { _ } from 'meteor/underscore';

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
  if (!config || _.isEmpty(config)) { throw new Error('must supply a config'); }
  if (!config.path) { throw new Error('must supply a path'); }
  if (!config.onVerified || typeof config.onVerified !== "function") {
    throw new Error('onVerified function must be supplied');
  }
  if (config.onError && typeof config.onError !== "function") {
    throw new Error('onError must be a function');
  }

  const self = this;
  self._config = config;
  self._path = config.path;
  self._allow_sandbox = config.allow_sandbox || false;
  self._verify = config.verify || Meteor.wrapAsync(ipn.verify, ipn);
  self._onVerified = config.onVerified;
  self._onError = config.onError || function(e) { console.error(e) ; };
  self._picker = configurePicker();


  function createHandler (){
    return function(params, req, res, next) {
      res.writeHead(200);
      let verified = '';

      try {
        verified = self._verify(req.body, { allow_sandbox: self._allow_sandbox });

        if (verified === true || verified === 'VERIFIED' ) {
          self._onVerified(req.body);
        } else {
          self._onError(new Error('unverified'), req.body);
        }

      } catch (e) {
        self._onError(e, req.body);
      }

      res.end();
    };
  }

  self._handler = createHandler();
  self._picker.route(self._path, self._handler);

};
