# meteor-ipn-listener
Simple PayPal IPN Listener for Meteor

### To install
From your Meteor project directory:
```
$ meteor add planefy:paypal-ipn-listener
```

### Basic Usage

Server-side only:
```javascript
import { IpnListener } from 'meteor/planefy:paypal-ipn-listener';

const myListener = new IpnListener({
    path: '/ipn',
});

myListener.onVerified(function(error, ipn) {
  // your code here
  // error will be null
  // ipn will be the IPN message from PayPal
});

myListener.onError(function(error, ipn) {
  // your code here
  // ipn will be the IPN message from PayPal if available
});
```

### Defining
```javascript
import { IpnListener } from 'meteor/planefy:paypal-ipn-listener';

const myListener = new IpnListener(options);
```

#### Options

| Options | Type   | Required | Default | Description |
|---------|--------|:--------:|---------|-------------|
| path    | String | Y        |  n/a    | the route path for the listener (include leading slash) |
| allow_sandbox | Boolean | N | false   | Allow Sandbox IPNs (e.g. from PayPal's IPN Simulator).  Set to true in development |
| host    | String | N        | Meteor.absoluteUrl() | Override the host in development, when using a tunnel (see below) |

### API  

**myListener.onVerified(handler)**

register a handler for verified ipns.  handler should be a function that accepts two arguments: error and ipn.

You can register multiple handlers.  

**myListener.onError(handler)**
register a handler for errors, e.g. if the IPN can't be verified

You can register multiple error handlers.

**myListener.url()**

Return the full URL of the registered listener

```javascript
const myListener = new IpnListener({ path: '/ipn'});
console.log(myListener.url()) // http://localhost:3000/ipn

const otherListener = new IpnListener({ path: 'ipn', host: 'http://example.ngrok.io/' });
console.log(otherListener.url()) // http://example.ngrok.io/ipn
```

**myListener.post(httpOptions, [options])**

Post data to your listener, e.g. for testing. By default, this will not attempt to verify the IPN with PayPal.  Pass {verify : true } as the second paramter to override this behavior (e.g. for error testing).

First parameter, httpOptions, is passed direction to HTTP.post (```http://docs.meteor.com/api/http.html#HTTP-post```).

```javascript
myListener.onVerified(function(err, ipn) {
  console.log(ipn);  
});

myListener.onError(function(err, ipn) {
  console.log('an error occurred');
})

myListener.post({
  data: {
    test_ipn : 1
  }
});

myListener.post({
  data: {
    test_ipn: 1
  }
}, { verify : true });

//  { test_ ipn : 1 }
// 'an error occurred'
```

### Testing

#### Using PayPal IPN Simulator

In development, IPNs can't be sent from PayPal to localhost, so you'll need to set up a tunnel.

I recommend ngrok (https://ngrok.com/)

With your Meteor app running, open a new terminal and type:
```
$ ngrok http 3000
```
Where 3000 is the port on which your app is running (change as necessary).

After ngrok starts, note the 'forwarding' url, and pass to your ipnListener, e.g.:
```javascript
const myListener = new IpnListener({
  path: '/ipn',
  host: 'http://1c2fce0e.ngrok.io/ipn/'   // **NOTE trailing slash!
});
```

Log in to your PayPal developer account and go to https://developer.paypal.com/developer/ipnSimulator/

Enter the IPN handler URL using the ngrok url combined with your IPN path, e.g. ```http://1c2fce0e.ngrok.io/ipn```
