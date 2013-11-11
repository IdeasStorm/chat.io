var Conversation = require("./models/conversation")
    , passportSocketIo = require("passport.socketio");
var User = require("./models/user_model");
function ChatBackend(io) {
    var self = this;
    //private members
    var users = [];
    var conversations = [];

    this.start= function() {
        io.sockets.on('connection', function(socket){
            var user = new User(socket, self);
            socket.broadcast.emit('new_user', {username: user.id});
            users[user.id] = user;
            users.push(user);
        });

        io.sockets.on('close', function (socket) {
            var sess = socket.handshake.session;
            var user = sess.user;
            if (user)
                user.setOffline();
        });

        io.sockets.on("connection", function(socket){


        });

        io.sockets.on('connection', function (socket) {
            var user = socket.handshake.user;
            if (user) {
                console.log("user connected: ", socket.handshake.user.username);
                user.setOnline(socket, self);

                socket.log.info(
                    'a socket with sessionID'
                    , socket.handshake.sessionID
                    , 'connected'
                );

                // REMOVE ME
                socket.on('set value', function (val) {
                    sess.reload(function () {
                        sess.value = val;
                        sess.touch().save();
                    });
                });
            }
        });
    }

    this.broadcast = function(channel, data) {
        io.broadcast.emit(channel, data);
    }

    this.getConversation = function(id) {
        return conversations[id];
    }

    this.getUser = function(id) {
        return users[id];
    }

    this.getUsers = function() {
        return users.map(function(value) {return {username: value.id}});
    }

    this.createConversation = function(id) {
        if (conversations[id]) throw "conversation already exists";
        return conversations[id] = new Conversation(id, self);
    }
}

exports.Backend = ChatBackend;