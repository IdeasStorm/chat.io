chat.io
=======

chat app using socket.io

Running The App
===============
* first install the latest nodejs release, or update it from here http://davidwalsh.name/upgrade-nodejs
* then `cd` into the app folder
* type `npm install`
* you can start the project by running `npm start`


Notice
======
make sure you've installed the latest nodejs version, if you haven't plz update it from here [http://davidwalsh.name/upgrade-nodejs]

Web Interface Helpers
=====================
Emitter
-------
just use this notation to emit an event to the server

```html
<a href="#emit" data-arg1="val1" data-arg2="val2" ... > Emit Event </a>
```

*Example*
```html
<a href="#emit" data-message="hello world !" data-conversation_id="newbies" > Emit Event </a>
```
