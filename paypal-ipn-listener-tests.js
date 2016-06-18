import { Meteor } from 'meteor/meteor';
import { expect } from 'meteor/practicalmeteor:chai';
import { IpnListener} from "meteor/planefy:paypal-ipn-listener";
import { Picker } from 'meteor/meteorhacks:picker';
import { spies, stubs, sinon } from 'meteor/practicalmeteor:sinon';
import { HTTP } from 'meteor/http';
import { _ } from 'meteor/underscore';

const sendIpn = function(path, data) {
  let url = Meteor.absoluteUrl(path);
  return HTTP.post(url, { data });
};

const emptyFn = function() { return ;};

const data = {
  accountId: 1,
  email: 'email@example.com'
};

if (Meteor.isServer) {
  describe('IPN Listeners', function() {
    describe('Defining', function() {
      it('throws an error if no config is supplied', function() {
        expect(function() {
          return new IpnListener({});
        }).to.throw(/must supply a config/);
      });

      it('throws an error if no path is supplied', function() {
        expect(function() {
          return new IpnListener({test: 1});
        }).to.throw(/must supply a path/);
      });

      it('returns an object', function() {
        let listener = new IpnListener({
          path: '/test',
          onVerified: function() { return ; }
        });
        expect(listener).to.be.a.object;
        expect(listener._path).to.equal('/test');
        expect(listener._allow_sandbox).to.be.false;
      });
    });

    describe('Receiving a valid IPN message', function() {
      let listener;
      let result;

      before(function() {
        listener = new IpnListener({path: '/good', onVerified: emptyFn, onError: emptyFn });
        stubs.create('verify', listener, '_verify');
        stubs.verify.returns('VERIFIED');
        spies.create('onVerified', listener, '_onVerified');
        spies.create('onError', listener, '_onError');
        result = sendIpn('good', data );
      });

      after(function() {
        stubs.restoreAll();
        spies.restoreAll();
      });

      it('returns a status code of 200', function() {
        expect(result.statusCode).to.equal(200);
      });

      it('verifies the IPN with PayPal', function() {
        expect(stubs.verify).to.have.been.calledWith(data);
      });

      it('calls the onVerified hook', function() {
        expect(spies.onVerified).to.have.been.calledWith(data);
      });

      it('does not call the onError hook', function() {
        expect(spies.onError).to.not.have.been.called;
      });
    });

    describe('Receiving an invalid IPN message', function() {
      let listener;
      let result;

      before(function() {
        listener = new IpnListener({path: '/bad', onVerified: emptyFn, onError: emptyFn });
        stubs.create('verify', listener, '_verify');
        stubs.verify.returns(false);
        spies.create('onVerified', listener, '_onVerified');
        spies.create('onError', listener, '_onError');
        result = sendIpn('bad', data );
      });

      after(function() {
        stubs.restoreAll();
        spies.restoreAll();
      });

      it('returns a status code of 200', function() {
        expect(result.statusCode).to.equal(200);
      });

      it('verifies the IPN with PayPal', function() {
        expect(stubs.verify).to.have.been.calledWith(data);
      });

      it('does not call the onVerified hook', function() {
        expect(spies.onVerified).to.not.have.been.called;
      });

      it('calls the onError hook', function() {
        expect(spies.onError).to.have.been.calledWith(new Error('unverified'), data);
      });

    });

    it('are only triggered for POSTs', function() {
      let listener = new IpnListener({ path: '/post', onVerified: emptyFn });
      spies.create('handler', listener, '_handler');

      _.each(['get', 'put', 'del'], function(verb) {
        HTTP[verb](Meteor.absoluteUrl('post'), { data });
      });

      expect(spies.handler).to.not.have.been.called;
    });
  });
}
