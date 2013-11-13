function User(socket, system) {
    var self = this;
    var conversations = [];
    //region PRIVATE MEMBERS
        var network_driver;
    //endregion

    this.id = User.generateId();
    users.push(self);
    users[this.id] = self;

    //region PUBLIC MEMBERS
        this.publish = function(data) {
            socket.emit('message', data);
        }

        this.addConversation = function(c) {
            conversations.push(c);
        }

        this.getConversations =  function() {
            return conversations.map(function(c) {return {id: c.conversation_id, body: ''}});
        }
    //endregion

    socket.emit('name_change', {username: self.id});
    socket.broadcast.emit('new_user', {username: self.id});
    socket.emit('user_list', {users: system.getUsers()});
    socket.emit('conversation_list', {conversations: self.getConversations()})

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

//region PRIVATE STATIC MEMBERS
var last_id = 0;
var users = [];
//endregion

//region STATIC METHODS
    User.generateId = function() {
        return "user_" + last_id++ ;
    }
//endregion

module.exports = User;