//setup Dependencies
var connect = require('connect')
    , express = require('express')
    , port = (process.env.PORT || 8081)
    , passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy
    , MemoryStore = connect.middleware.session.MemoryStore
    , parseCookie = connect.utils.parseCookie
    , chat = require('./chat')
    , User = require('./models/user_model')
    , passportSocketIo = require("passport.socketio")
    , mongoose = require('mongoose')
    , io = require('socket.io')
    , store;

mongoose.connect('mongodb://localhost/chat_io');

// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

store = new MemoryStore();

//Setup Express
var server = express.createServer();
server.configure(function(){
    server.set('views', __dirname + '/views');
    server.set('view options', { layout: false });
    server.use(connect.bodyParser());
    server.use(express.cookieParser());
    server.use(express.session({
        secret: "my session secret",
        key: "express.sid",
        store: store
    }));
    server.use(connect.static(__dirname + '/static'));
    server.use(passport.initialize());
    server.use(passport.session());
    server.use(server.router);
});

//setup the errors
server.error(function(err, req, res, next){
    if (err instanceof NotFound) {
        res.render('404.jade', { locals: { 
                  title : '404 - Not Found'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX' 
                },status: 404 });
    } else {
        res.render('500.jade', { locals: { 
                  title : 'The Server Encountered an Error'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX'
                 ,error: err 
                },status: 500 });
    }
});
server.listen( port);

//Setup Socket.IO
var sio = io.listen(server);
sio.set("authorization", passportSocketIo.authorize({
    cookieParser: express.cookieParser, //or connect.cookieParser
    key:          'express.sid',        //the cookie where express (or connect) stores its session id.
    secret:       'my session secret',  //the session secret to parse the cookie
    store:         store,      //the session store that express uses
    fail: function(data, accept) {      // *optional* callbacks on success or fail
        accept(null, false);              // second param takes boolean on whether or not to allow handshake
    },
    success: function(data, accept) {
        accept(null, true);
    }
}));

var chatBackend = new chat.Backend(sio);
chatBackend.start();

///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

/////// ADD ALL YOUR ROUTES HERE  /////////

server.get('/', function(req,res){
  res.render('index.jade', {
    locals : { 
              title : 'Your Page Title'
             ,description: 'Your Page Description'
             ,author: 'Your Name'
             ,analyticssiteid: 'XXXXXXX' 
            }
  });
});

//A Route for Creating a 500 Error (Useful to keep around)
server.get('/500', function(req, res){
    throw new Error('This is a 500 Error');
});

server.get('/register', function(req, res) {
    res.render('register.jade', { });
});

server.post('/register', function(req, res) {
    User.register(new User({ username : req.body.username }), req.body.password, function(err, account) {
        if (err) {
            return res.render('register.jade', { account : account });
        }

        res.redirect('/');
    });
});

server.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function(req, res) {
    res.redirect('/');
});

server.get('/login', function(req, res) {
    res.render('login.jade', { user : req.user });
});

//The 404 Route (ALWAYS Keep this as the last route)
server.get('/*', function(req, res){
    throw new NotFound;
});

function NotFound(msg){
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}


console.log('Listening on http://0.0.0.0:' + port );
