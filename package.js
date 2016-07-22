Package.describe({
  name: 'planefy:paypal-ipn-listener',
  version: '1.0.0',
  // Brief, one-line summary of the package.
  summary: 'Simple PayPal IPN listener for Meteor',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/mbreuer23/meteor-ipn-listener.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  "body-parser": "1.14.1",
  "paypal-ipn" : "3.0.0",
});

Package.onUse(function(api) {
  api.versionsFrom('1.3.3');
  api.use([
    'ecmascript',
    'underscore',
    'http',
    'ejson',
    'meteorhacks:picker@1.0.3',
  ]);

  api.mainModule('listener.js', 'server');
});

Package.onTest(function(api) {
  api.use('planefy:paypal-ipn-listener');
  api.use('ecmascript');
  api.use('http');
  api.use('ejson');
  api.use('practicalmeteor:chai@2.1.0');
  api.use('practicalmeteor:sinon@1.14.1_2');

  api.mainModule('listener.tests.js', 'server');
});
