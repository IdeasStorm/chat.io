var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({});

User.plugin(passportLocalMongoose);

var model = mongoose.model('User', User);

model.prototype.send = function(signal, data) {
    if (!this.isOnline()) throw "User is not online";
    this.socket.emit(signal, data);
}

model.prototype.publish = function(data) {
    this.send('message', data);
}

model.prototype.isOnline = function(socket) {
    return Boolean(socket);
}

model.prototype.setOnline = function(socket, system) {
    this.system = system;
    this.socket = socket;
    this.onOnline();
}

model.prototype.setOffline = function() {
    this.socket = null;
}

model.prototype.onOnline = function() {
    var socket = this.socket;
    var system = this.system;
    var self = this;

    socket.on('message', function(data) {
        var conversation_id = data.conversation_id;
        var conversation = system.getConversation(conversation_id) || system.createConversation(conversation_id);
        if (conversation.count() == 0) conversation.addUser(self);
        conversation.publish(data.message, self);
    })

    socket.on('new_conversation', function(data) {
        var conversation_id = data.conversation_id;
        var conversation = system.getConversation(conversation_id) || system.createConversation(conversation_id);
        conversation.addUser(self);
        socket.emit('new_conversation', {conversation_id: conversation_id});
    })

    socket.on('invite', function(data) {
        var conversation_id = data.conversation_id;
        var user_id = data.user_id;
        var conversation = system.getConversation(conversation_id);
        if (conversation && conversation.contains(self)) {
            conversation.addUser(user_id);
        }else {
            throw "insufficient privileges";
        }
    })
}

module.exports = model;