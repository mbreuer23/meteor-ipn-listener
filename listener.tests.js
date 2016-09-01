import { Meteor } from 'meteor/meteor';
import { expect } from 'meteor/practicalmeteor:chai';
import { IpnListener} from "meteor/planefy:paypal-ipn-listener";
import { Picker } from 'meteor/meteorhacks:picker';
import { spies, stubs, sinon } from 'meteor/practicalmeteor:sinon';
import { HTTP } from 'meteor/http';
import { _ } from 'meteor/underscore';

const handlers = {
  success: function(error, ipn) {
    return ipn;
  },
  error: function(error, ipn) {
    return ipn;
  }
};

describe('IPN Listeners', function() {
  var myListener;
  var verified = [];
  var errors = [];

  before(function() {
    myListener = new IpnListener({
      path: '/ipn',
      allow_sanbdbox: true
    });

    spies.create('success', handlers, 'success');
    spies.create('error', handlers, 'error');
  });

  after(function() {
    spies.restoreAll();
  });

  it('can be defined', function() {
    expect(myListener).to.be.a.object;
  });

  it('has the right path', function() {
    expect(myListener._path).to.equal('/ipn');
  });

  it('knows its own URL', function() {
    let url = Meteor.absoluteUrl('ipn');
    expect(myListener.url()).to.equal(url);
  });

  it('returns the correct url if the host is overriden', function() {
    myListener._host = 'http://ngrok.io/';
    expect(myListener.url()).to.equal('http://ngrok.io/ipn');
    myListener._host = Meteor.absoluteUrl();
  });

  it('can have onVerified hooks added', function() {
    myListener.onVerified(handlers.success);
    _.times(3, function(i) {
      myListener.onVerified(function(error, ipn) {
        verified.push(i);
      });
    });

    expect(myListener._onVerified.length).to.equal(4);
  });

  it('can have onError hooks added', function() {
    myListener.onError(handlers.error);
    _.times(3, function(i) {
      myListener.onError(function(error, ipn) {
        errors.push(i);
      });
    });

    expect(myListener._onError.length).to.equal(4);
  });

  it('will pass Verified ipns to all onVerified hooks', function() {
    myListener.post({ data: { test : 1} });

    expect(spies.success).to.have.been.calledOnce;
    let call = spies.success.getCall(0);
    expect(call.args[0]).to.equal(null);
    expect(call.args[1]).to.deep.equal({ test : 1 });
    expect(spies.error).to.not.have.been.called;
    expect(verified).to.deep.equal([0,1,2]);
  });

  it('will pass unVerified ipns to all onError hooks', function() {
    spies.success.reset();
    spies.error.reset();

    myListener.post({ data: { test: 2 } }, { verify : true });

    expect(spies.success).to.not.have.been.called;
    expect(spies.error.callCount).to.equal(1);
    let call = spies.error.getCall(0);
    expect(call.args[0]).to.be.a.object;
    expect(call.args[1].test).to.equal(2);
    expect(errors).to.deep.equal([0, 1, 2]);
  });
});
