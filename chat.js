var Conversation = require("./models/conversation");
var User = require("./models/user");
function ChatBackend(io) {
    var self = this;
    //private members
    var users = [];
    var conversations = [];

    this.start= function() {
        io.sockets.on('connection', function(socket){
            var user = new User(socket, self);
            users[user.id] = user;
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

    this.createConversation = function(id) {
        if (conversations[id]) throw "conversation already exists";
        return conversations[id] = new Conversation(id, self);
    }
}

exports.Backend = ChatBackend;