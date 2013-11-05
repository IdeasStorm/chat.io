var Conversation = require("./models/conversation");
function ChatBackend() {
    var self = this;
    //private members
    var server;
    var users = [];
    var conversations = [];
    var middlewares = [];

    this.startSocket = function(socket) {
        var user = new User(socket, self);
        users[user.id] = user;
    }

    this.getConversation = function(id) {
        conversations[id] = conversations[id] || new Conversation(id, self);
        return conversations[id];
    }
}

exports.Backend = ChatBackend;