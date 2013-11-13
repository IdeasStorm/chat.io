var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({});
User.post('init', function() {
    this.conversations = [];
})

User.plugin(passportLocalMongoose);

var model = mongoose.model('User', User);

model.prototype.send = function (signal, data) {
    if (!this.isOnline()) throw "User is not online";
    this.socket.emit(signal, data);
}

model.prototype.publish = function (data) {
    this.send('message', data);
}

model.prototype.isOnline = function (socket) {
    return Boolean(socket);
}

model.prototype.setOnline = function (socket, system) {
    this.system = system;
    this.socket = socket;
    this.onOnline();
}

model.prototype.setOffline = function () {
    this.socket = null;
}


model.prototype.addConversation = function(c) {
    this.conversations.push(c);
}


model.prototype.getConversations =  function() {
    return this.conversations.map(function(c) {return {id: c.conversation_id}});
}

model.prototype.onOnline = function () {
    var socket = this.socket;
    var system = this.system;
    var self = this;

    system.addUser(self);

    socket.emit('name_change', {username: self.username});
    socket.broadcast.emit('new_user', {username: self.id});
    socket.emit('user_list', {users: system.getUsers()});
    socket.emit('conversation_list', {conversations: self.getConversations()})

    socket.on('message', function (data) {
        var conversation_id = data.conversation_id;
        var conversation = system.getConversation(conversation_id);
        conversation.publish(data.message, self);
    })

    socket.on('new_conversation', function (data) {
        var conversation_id = data.conversation_id;
        var conversation = system.createConversation(conversation_id);
        conversation.addUser(self);
        socket.emit('new_conversation', {conversation_id: conversation_id});
    })

    socket.on('invite', function (data) {
        var conversation_id = data.conversation_id;
        var user_id = data.user_id;
        var conversation = system.getConversation(conversation_id);
        if (conversation && conversation.contains(self)) {
            User.findOne({username: user_id}, function(err, user){
                conversation.addUser(user);
                user.send('welcome', data);
            })
            socket.emit('invite', data);
        } else {
            socket.emit('error', {message:  'Insufficient Privileges !'})
        }
    })

    var certs = [];
    socket.on('cert_request', function(data) {
        if (certs[data.username]) { /// there's a cached certificate
            data.cert = certs[data.username];
            socket.emit('cert_response', data);
        } else {
            User.findOne({username: data.username}, function(err, user) { // let's find the user
                if (user.isOnline()) { // if the user is online
                    user.send('cert_request', data); // request his cert
                    user.on('cert_response', function(certdata){ // waiting for response
                        certs[data.username] = certdata.cert;
                        socket.emit('cert_response', certdata); // sending the cert back to the user requesting it
                    })
                }else {
                    data.error = 'user is not online';
                    socket.emit('cert_response', data) // sending the error back
                }
            })
        }
    })
}

module.exports = model;