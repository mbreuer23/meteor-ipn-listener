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
import { IpnListener } from 'meteor:planefy-ipn-listener';

const myListener = new IpnListener({
    path: '/ipn',
    onVerified (ipn) {
      // Define a handler for verified IPNs
      
      // At this point, the IPN has been verified with PayPal, but you'll probably need to do 
      // additional checks here:
      // e.g. check that ipn.payment_status === "COMPLETED" or similar
    },
    onError (error, ipn) {
      // handle errors here
    }
  });
```

### Options 

| Options | Type   | Required | Default | Description |
|---------|--------|:--------:|---------|-------------|
| path    | String | Y        |  n/a    | the route path for the listener (include leading slash) |
| onVerified | Function | Y   | n/a     | handler for verified IPNs.  Received the request body   |
| onError    | Function | N   | n/a     | function to handle errors (e.g. if IPN can't be verified)           |
| allow_sandbox | Boolean | N | false   | Allow Sandbox IPNs (e.g. from PayPal's IPN Simulator).  Set to true in development | 
| verify      |  Function | N | see desc | Define your own verification function.  Must return true or 'VERIFIED' to be deemed verified and passed to the onVerified hook.  **Use this in development only**. 
|


### Testing

#### From the client
From the client, you can do: 
```javascript
let url = Meteor.absoluteUrl('ipn');
HTTP.post(url, { data: { test: 1 } } );
```

Note that since this is not a valid IPN (e.g. didn't come from PayPal), it will not be verified and your listener's onError hook will be triggered.  You can define your own verify function (see options above) to override this.  **Only override the verify function in development**


#### Using PayPal IPN Simulator

In development, IPNs can't be send from PayPal to localhost, so you'll need to set up a tunnel.

I recommend ngrok (https://ngrok.com/)

With your Meteor app running, open a new terminal and type: 
```
$ ngrok http 3000
```
Where 3000 is the port on which your app is running (change as necessary).

After ngrok starts, note the 'forwarding' url.

Log in to your PayPal developer account and go to https://developer.paypal.com/developer/ipnSimulator/

Enter the IPN handler URL using the ngrok url combined with your IPN path, e.g. ```http://1c2fce0e.ngrok.io/ipn```
 
 

  




